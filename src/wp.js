

const { Worker, isMainThread, parentPort } = require("worker_threads");

const { fileURLToPath } = require('url');
const { dirname, isAbsolute, join } = require('path');

const fs = require("fs");

const zejs = require("./ze.js");

const DEFAULT_POOL_SIZE = 3;

if (!isMainThread) {
    parentPort.on("message", ({ str, context }) => {
        try {
            parentPort.postMessage(zejs.exec(str, context));
        } catch (err) {
            parentPort.postMessage({ error: err.message });
        }
    });
}

class wp {
    constructor(pool_size) {
        this.path = __filename;
        this.pool_size = pool_size || DEFAULT_POOL_SIZE;
        this.idle_workers = [];
        this.queue = [];
        this.dropped = false;
        this.cache = new Map();

        for (let i = 0;i < this.pool_size; i++) {
            this.create_worker();
        }
    }
    create_worker() {
        let worker = new Worker(this.path);
        worker._callback = null; // callback(err, data)

        worker.on("message", (res) => {
            worker.task.resolve(res);
            this.release_worker(worker);
        });

        worker.on("error", (err) => {
            worker.task.reject(err);
            this.release_worker(worker);
        });

        worker.on("exit", (code) => {
            console.error("Worker exited with code " + code);
            this.create_worker();
        });

        this.idle_workers.push(worker);
    }
    release_worker(worker) {
        if (this.dropped) {
            worker.terminate();
            return;
        }
        worker.task = null;
        this.idle_workers.push(worker);
        this.next();
    }
    next() {
        if (this.queue.length === 0 || this.idle_workers.length === 0) return;
        let worker = this.idle_workers.pop();
        let { str, context, resolve, reject } = this.queue.shift();
        worker.task = { resolve, reject };
        worker.postMessage({ str, context });
    }
    exec(str, context) {
        return new Promise((resolve, reject) => {
            context = context || {};
            this.queue.push({ str, context, resolve, reject });
            this.next();
        });
    }
    exec_file(path, context) {
        return new Promise((resolve, reject) => {
            context = context || {};
            fs.readFile(path, "utf-8", (err, data) => {
                if (err) {
                    reject(err);
                } else {
                    context.exec_path = dirname(path);
                    this.exec(data, context).then((res) => {
                        resolve(res);
                    });
                }
            });
        });
    }
    cache_exec_file(path, context) {
        return new Promise((resolve, reject) => {
            let result = this.cache.get(path);
            if (result) {
                resolve(result);
            } else {
                this.exec_file(path, context).then((res) => {
                    this.cache.set(path, res);
                    resolve(res);
                });
            }
        });
    }
    drop() {
        this.dropped = true;
        for (let i = 0;i < this.idle_workers.length;i++) {
            this.idle_workers[i].terminate();
        }
    }
}

module.exports = wp;
