import {openSync,writeFileSync,fsyncSync,closeSync,renameSync,unlinkSync,existsSync} from 'node:fs';
export function atomicJson(path,value){
 const temp=path+'.'+process.pid+'.tmp';let fd;
 try{fd=openSync(temp,'w',0o600);writeFileSync(fd,JSON.stringify(value,null,2));fsyncSync(fd);closeSync(fd);fd=undefined;renameSync(temp,path);}
 finally{if(fd!==undefined)closeSync(fd);if(existsSync(temp))unlinkSync(temp);}
}
