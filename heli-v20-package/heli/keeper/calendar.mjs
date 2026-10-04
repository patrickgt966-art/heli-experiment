export const DAY=86400;
export function boundary(start,n){
 if(!Number.isSafeInteger(start)||!Number.isInteger(n)||n<0||n>720)throw Error('Invalid calendar');
 const anchor=new Date(start*1000),target=new Date(Date.UTC(anchor.getUTCFullYear(),anchor.getUTCMonth()+n,1,anchor.getUTCHours(),anchor.getUTCMinutes(),anchor.getUTCSeconds()));
 const max=new Date(Date.UTC(target.getUTCFullYear(),target.getUTCMonth()+1,0)).getUTCDate();
 target.setUTCDate(Math.min(anchor.getUTCDate(),max));return Math.floor(target.getTime()/1000);
}
export function completedMonths(start,now){let lo=0,hi=721;while(lo+1<hi){const mid=Math.floor((lo+hi)/2);if(boundary(start,mid)<=now)lo=mid;else hi=mid;}return now<start?0:lo;}
