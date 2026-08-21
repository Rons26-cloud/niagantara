export interface ErrorMonitorEvent{requestId?:string;code:string;operation:string;exceptionClass?:string;}
export interface ErrorMonitor{capture(event:ErrorMonitorEvent):void;}
export class StructuredErrorMonitor implements ErrorMonitor{capture(event:ErrorMonitorEvent){process.stderr.write(JSON.stringify({timestamp:new Date().toISOString(),level:'error',event:'application.error',request_id:event.requestId??null,code:event.code,operation:event.operation,exception_class:event.exceptionClass??null})+'\n');}}
export const errorMonitor:ErrorMonitor=new StructuredErrorMonitor();
