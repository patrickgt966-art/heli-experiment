// Integer Gregorian calendar, UTC. Month boundaries always derive from the original anchor.
pub const DAY:i64=86400;
pub fn days(y:i64,m:i64,d:i64)->i64 {
 let y=y-if m<=2 {1}else{0}; let era=y.div_euclid(400);let yo=y-era*400;
 let mp=m+if m>2 {-3}else{9};let doy=(153*mp+2)/5+d-1;
 era*146097+yo*365+yo/4-yo/100+doy-719468
}
pub fn civil(z:i64)->(i64,i64,i64) {
 let z=z+719468;let era=z.div_euclid(146097);let doe=z-era*146097;
 let yo=(doe-doe/1460+doe/36524-doe/146096)/365;let y=yo+era*400;
 let doy=doe-(365*yo+yo/4-yo/100);let mp=(5*doy+2)/153;
 let d=doy-(153*mp+2)/5+1;let m=mp+if mp<10 {3}else{-9};
 (y+if m<=2 {1}else{0},m,d)
}
pub fn boundary(start:i64,n:u16)->i64 {
 let (y,m,d)=civil(start.div_euclid(DAY));let k=y*12+m-1+n as i64;
 let y=k.div_euclid(12);let m=k.rem_euclid(12)+1;
 let leap=y%4==0&&(y%100!=0||y%400==0);
 let max=match m {2=>if leap {29}else{28},4|6|9|11=>30,_=>31};
 days(y,m,d.min(max))*DAY+start.rem_euclid(DAY)
}
pub fn epoch(start:i64,now:i64)->u16 {
 if now<start{return 0;}let(mut lo,mut hi)=(0u16,721u16);
 while lo+1<hi {let mid=lo+(hi-lo)/2;if boundary(start,mid)<=now{lo=mid;}else{hi=mid;}}
 lo+1
}
// Uncapped month number for recurring limits that outlive the 720-month supply calendar.
// Equals epoch() for months 1..=720 and keeps counting afterwards (saturates at u16::MAX).
pub fn month_index(start:i64,now:i64)->u16 {
 if now<start{return 0;}
 let (y0,m0,_)=civil(start.div_euclid(DAY));let (y,m,_)=civil(now.div_euclid(DAY));
 let mut k=((y-y0)*12+(m-m0)).clamp(0,u16::MAX as i64-1);
 if k>0&&boundary(start,k as u16)>now {k-=1;}
 if k<u16::MAX as i64-1&&boundary(start,(k+1) as u16)<=now {k+=1;}
 (k+1).min(u16::MAX as i64) as u16
}
