import assert from'node:assert/strict';import test from'node:test';import{retryDelayMs,safeSheetValue,workerEnvironment}from'../src/sheet-worker.js';
test('formula-like source values are forced to literal text',()=>{for(const v of['=1+1','+SUM(A:A)','-2+3','@evil'])assert.equal(String(safeSheetValue(v))[0],"'");assert.equal(safeSheetValue('safe'),'safe')});
test('retry backoff is exponential, jittered, and capped',()=>{assert.equal(retryDelayMs(1,0),750);assert.equal(retryDelayMs(2,0),1500);assert.equal(retryDelayMs(20,0),675000)});
test('worker refuses to start without external configuration',()=>{assert.throws(()=>workerEnvironment({} as any),/SUPABASE_URL is required/)});
