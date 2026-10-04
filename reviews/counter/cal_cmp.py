import random,subprocess,json,sys
DAY=86400
def days(y,m,d):
    y=y-(1 if m<=2 else 0);era=y//400;yo=y-era*400;mp=m+(-3 if m>2 else 9);doy=(153*mp+2)//5+d-1
    return era*146097+yo*365+yo//4-yo//100+doy-719468
def tdiv(a,b): # rust integer division truncates
    q=abs(a)//abs(b); return q if (a>=0)==(b>0) else -q
def civil(z):
    z=z+719468;era=z//146097;doe=z-era*146097
    yo=tdiv(doe-tdiv(doe,1460)+tdiv(doe,36524)-tdiv(doe,146096),365);y=yo+era*400
    doy=doe-(365*yo+tdiv(yo,4)-tdiv(yo,100));mp=tdiv(5*doy+2,153);d=doy-tdiv(153*mp+2,5)+1;m=mp+(3 if mp<10 else -9)
    return (y+(1 if m<=2 else 0),m,d)
def boundary(start,n):
    y,m,d=civil(start//DAY);k=y*12+m-1+n;y=k//12;m=k%12+1
    leap=y%4==0 and (y%100!=0 or y%400==0);mx={2:29 if leap else 28,4:30,6:30,9:30,11:30}.get(m,31)
    return days(y,m,min(d,mx))*DAY+start%DAY
random.seed(1)
starts=[random.randint(1_790_000_000,1_900_000_000) for _ in range(300)]+[1_785_000_000+i*DAY for i in range(400)]
js="import {boundary} from '%s';const s=JSON.parse(process.argv[1]);console.log(JSON.stringify(s.map(x=>Array.from({length:721},(_,n)=>boundary(x,n)))))"%sys.argv[1]
out=json.loads(subprocess.run(['node','--input-type=module','-e',js,json.dumps(starts)],capture_output=True,text=True).stdout)
bad=[(s,n,boundary(s,n),out[i][n]) for i,s in enumerate(starts) for n in range(721) if boundary(s,n)!=out[i][n]]
print('compared',len(starts)*721,'boundaries; mismatches',len(bad),bad[:3])
