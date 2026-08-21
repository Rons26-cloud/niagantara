import{createWorker}from'./sheet-worker.js';
const interval=Math.max(1000,Number(process.env.SHEET_SYNC_INTERVAL_MS||5000));let stopping=false;
async function loop(){const worker=createWorker();while(!stopping){try{const count=await worker.runOnce();if(count===0)await new Promise(r=>setTimeout(r,interval))}catch(e){console.error('sheet-sync-worker-error',e instanceof Error?e.message:'unknown');await new Promise(r=>setTimeout(r,interval))}}}
process.on('SIGTERM',()=>{stopping=true});process.on('SIGINT',()=>{stopping=true});
void loop();
