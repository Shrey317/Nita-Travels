import { PrismaClient, Category } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

const rawCsv = `Date,Week,Month,Year,Vehicle ID,Make,Model,Registration Details,Expense Type,Income,Expense,Sr.No,Key,Mileage
20/7/2025,30,Jul,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,Uber Fees,,"R13,050",7,7.Jul,
20/7/2025,30,Jul,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,Uber Fees,,"R13,050",7,7.Jul,
7/9/2025,37,Sep,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R1,800",,9,9.Sep,
7/9/2025,37,Sep,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R1,800",,9,9.Sep,
14/9/2025,38,Sep,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,9,9.Sep,
14/9/2025,38,Sep,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,9,9.Sep,
19/9/2025,38,Sep,2025,CR03,VW,Kombi,MG 81 DR GP,Volvo & Corolla,,"R21,500",9,9.Sep,
19/9/2025,38,Sep,2025,CR03,VW,Kombi,MG 81 DR GP,Repairs,,"R18,500",9,9.Sep,
19/9/2025,38,Sep,2025,CR03,VW,Kombi,MG 81 DR GP,Uber Fees,,"R9,300",9,9.Sep,
21/9/2025,39,Sep,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,9,9.Sep,
21/9/2025,39,Sep,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,9,9.Sep,
21/9/2025,39,Sep,2025,CR03,VW,Kombi,MG 81 DR GP,,R900,,9,9.Sep,
28/9/2025,40,Sep,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,9,9.Sep,
28/9/2025,40,Sep,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,9,9.Sep,
1/10/2025,40,Oct,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,10,10.Oct,
1/10/2025,40,Oct,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,10,10.Oct,
4/10/2025,40,Oct,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,10,10.Oct,
4/10/2025,40,Oct,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,10,10.Oct,
4/10/2025,40,Oct,2025,CR03,VW,Kombi,MG 81 DR GP,,"R4,500",,10,10.Oct,
8/10/2025,41,Oct,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,10,10.Oct,
8/10/2025,41,Oct,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,10,10.Oct,
15/10/2025,42,Oct,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,10,10.Oct,
15/10/2025,42,Oct,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,10,10.Oct,
22/10/2025,43,Oct,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,10,10.Oct,
22/10/2025,43,Oct,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,10,10.Oct,
22/10/2025,43,Oct,2025,CR03,VW,Kombi,MG 81 DR GP,,"R5,400",,10,10.Oct,
23/10/2025,43,Oct,2025,CR04,Suzukki,S PRESSO,MN 81 MC GP,Uber Fees,,"R7,500",10,10.Oct,
11/11/2025,46,Nov,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,11,11.Nov,
11/11/2025,46,Nov,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,11,11.Nov,
18/11/2025,47,Nov,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,Annual Service,,"R3,386",11,11.Nov,
18/11/2025,47,Nov,2025,CR05,Suzukki,S PRESSO,LP 66 LB GP,Double Disc ,,R425,11,11.Nov,
18/11/2025,47,Nov,2025,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,Double Disc ,,R425,11,11.Nov,
20/11/2025,47,Nov,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,Service,,"R3,000",11,11.Nov,
20/11/2025,47,Nov,2025,CR04,Suzukki,S PRESSO,MN 81 MC GP,Service,,"R3,000",11,11.Nov,
20/11/2025,47,Nov,2025,CR05,Suzukki,S PRESSO,LP 66 LB GP,Service,,"R3,000",11,11.Nov,
20/11/2025,47,Nov,2025,CR04,Suzukki,S PRESSO,MN 81 MC GP,Meter Taxi,,"R2,500",11,11.Nov,
20/11/2025,47,Nov,2025,CR05,Suzukki,S PRESSO,LP 66 LB GP,Meter Taxi,,"R2,500",11,11.Nov,
20/11/2025,47,Nov,2025,CR04,Suzukki,S PRESSO,MN 81 MC GP,Uber Inspection,,"R1,000",11,11.Nov,
20/11/2025,47,Nov,2025,CR05,Suzukki,S PRESSO,LP 66 LB GP,Uber Inspection,,"R1,000",11,11.Nov,
27/11/2025,48,Nov,2025,CR03,VW,Kombi,MG 81 DR GP,,"R9,000",,11,11.Nov,
27/11/2025,48,Nov,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,11,11.Nov,
27/11/2025,48,Nov,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,11,11.Nov,
29/11/2025,48,Nov,2025,CR07,Suzukki,S PRESSO,MS 29 BZ GP,Meter Taxi,,"R2,500",11,11.Nov,
29/11/2025,48,Nov,2025,CR07,Suzukki,S PRESSO,MS 29 BZ GP,Double Disc,,"R1,500",11,11.Nov,
29/11/2025,48,Nov,2025,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,Full Tank,,R500,11,11.Nov,
29/11/2025,48,Nov,2025,CR07,Suzukki,S PRESSO,MS 29 BZ GP,Uber Inspection,,R500,11,11.Nov,
3/12/2025,49,Dec,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,12,12.Dec,
3/12/2025,49,Dec,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,12,12.Dec,
3/12/2025,49,Dec,2025,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,12,12.Dec,
8/12/2025,50,Dec,2025,CR03,VW,Kombi,MG 81 DR GP,Battery Replacement,,"R3,500",12,12.Dec,
8/12/2025,50,Dec,2025,CR07,Suzukki,S PRESSO,MS 29 BZ GP,License Plate,,R380,12,12.Dec,
10/12/2025,50,Dec,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,12,12.Dec,
10/12/2025,50,Dec,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,12,12.Dec,
10/12/2025,50,Dec,2025,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,12,12.Dec,
10/12/2025,50,Dec,2025,CR03,VW,Kombi,MG 81 DR GP,,"R4,000",,12,12.Dec,
15/12/2025,51,Dec,2025,ALLCR,,,,Insurance,,"R16,300",12,12.Dec,
18/12/2025,51,Dec,2025,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,12,12.Dec,
18/12/2025,51,Dec,2025,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,12,12.Dec,
18/12/2025,51,Dec,2025,CR03,VW,Kombi,MG 81 DR GP,,"R4,800",,12,12.Dec,
18/12/2025,51,Dec,2025,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,12,12.Dec,
15/1/2026,3,Jan,2026,ALLCR,,,,Insurance,,"R16,300",1,1.Jan,
22/1/2026,4,Jan,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,1,1.Jan,
22/1/2026,4,Jan,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,1,1.Jan,
22/1/2026,4,Jan,2026,CR03,VW,Kombi,MG 81 DR GP,,"R5,800",,1,1.Jan,
22/1/2026,4,Jan,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,1,1.Jan,
22/1/2026,4,Jan,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,1,1.Jan,
23/1/2026,4,Jan,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,Repairs,,"R2,800",1,1.Jan,
24/1/2026,4,Jan,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,Service,,"R3,000",1,1.Jan,
28/1/2026,5,Jan,2026,CR03,VW,Kombi,MG 81 DR GP,Repairs,,"R8,200",1,1.Jan,
31/1/2026,5,Jan,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,Uber Fees,,"R6,000",1,1.Jan,
31/1/2026,5,Jan,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,Uber Fees,,"R6,000",1,1.Jan,
8/2/2026,7,Feb,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,2,2.Feb,
8/2/2026,7,Feb,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,2,2.Feb,
8/2/2026,7,Feb,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,2,2.Feb,
8/2/2026,7,Feb,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,2,2.Feb,
8/2/2026,7,Feb,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,2,2.Feb,
8/2/2026,7,Feb,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,2,2.Feb,
9/2/2026,7,Feb,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,Service,,"R3,000",2,2.Feb,
9/2/2026,7,Feb,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,Service,,"R3,000",2,2.Feb,
9/2/2026,7,Feb,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,Service,,"R3,000",2,2.Feb,65000
9/2/2026,7,Feb,2026,ALLCR,,,,BRN Cert,,R800,2,2.Feb,
12/2/2026,7,Feb,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,Brake Pads,,"R1,500",2,2.Feb,
16/2/2026,8,Feb,2026,ALLCR,,,,Insurance,,"R16,300",2,2.Feb,
18/2/2026,8,Feb,2026,CR03,VW,Kombi,MG 81 DR GP,Repairs,,"R25,000",2,2.Feb,
20/2/2026,8,Feb,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,Service,,"R3,360",2,2.Feb,
20/2/2026,8,Feb,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,Service,,"R3,360",2,2.Feb,
20/2/2026,8,Feb,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,2,2.Feb,
20/2/2026,8,Feb,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,2,2.Feb,
20/2/2026,8,Feb,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,2,2.Feb,
20/2/2026,8,Feb,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,2,2.Feb,
20/2/2026,8,Feb,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,2,2.Feb,
20/2/2026,8,Feb,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,2,2.Feb,
27/2/2026,9,Feb,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,2,2.Feb,
27/2/2026,9,Feb,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,2,2.Feb,
27/2/2026,9,Feb,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,2,2.Feb,
27/2/2026,9,Feb,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,2,2.Feb,
27/2/2026,9,Feb,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,2,2.Feb,
27/2/2026,9,Feb,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,2,2.Feb,
5/3/2026,10,Mar,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R1,430",,3,3.Mar,
5/3/2026,10,Mar,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,3,3.Mar,
5/3/2026,10,Mar,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,3,3.Mar,
5/3/2026,10,Mar,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,3,3.Mar,
5/3/2026,10,Mar,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,3,3.Mar,
8/3/2026,11,Mar,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,Front Tyre Replacement,,"R3,540",3,3.Mar,
8/3/2026,11,Mar,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,Brake Pads,,"R1,350",3,3.Mar,
12/3/2026,11,Mar,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,R800,,3,3.Mar,
12/3/2026,11,Mar,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,3,3.Mar,
12/3/2026,11,Mar,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,3,3.Mar,
12/3/2026,11,Mar,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,3,3.Mar,
12/3/2026,11,Mar,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,3,3.Mar,
18/3/2026,12,Mar,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,3,3.Mar,
18/3/2026,12,Mar,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,3,3.Mar,
18/3/2026,12,Mar,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,3,3.Mar,
18/3/2026,12,Mar,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,3,3.Mar,
18/3/2026,12,Mar,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,3,3.Mar,
18/3/2026,12,Mar,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R1,140",,3,3.Mar,
26/3/2026,13,Mar,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,3,3.Mar,
26/3/2026,13,Mar,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,3,3.Mar,
26/3/2026,13,Mar,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,3,3.Mar,
26/3/2026,13,Mar,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,3,3.Mar,
26/3/2026,13,Mar,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,3,3.Mar,
31/3/2026,13,Mar,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,Brake Pads,,"R1,350",3,Key,54435
31/3/2026,13,Mar,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,Brake Pads,,"R1,350",3,Key,60468
31/3/2026,13,Mar,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,Brake Pads,,"R1,350",3,Key,86846
3/4/2026,14,Apr,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,R857,,4,4.Apr,
3/4/2026,14,Apr,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R1,402",,4,4.Apr,
3/4/2026,14,Apr,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,4,4.Apr,
3/4/2026,14,Apr,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,4,4.Apr,
3/4/2026,14,Apr,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,4,4.Apr,
3/4/2026,14,Apr,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,4,4.Apr,
3/4/2026,14,Apr,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R2,000",,4,4.Apr,
8/4/2026,14,Apr,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,Bumper Repairs,,"R3,050",4,4.Apr,
11/4/2026,14,Apr,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,4,4.Apr,
11/4/2026,14,Apr,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,4,4.Apr,
11/4/2026,14,Apr,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,4,4.Apr,
11/4/2026,15,Apr,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,4,4.Apr,
11/4/2026,14,Apr,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,4,4.Apr,
11/4/2026,14,Apr,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R1,715",,4,4.Apr,
11/4/2026,14,Apr,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R2,000",,4,4.Apr,
17/4/2026,14,Apr,2026,,,,,Petrol,,R680,4,4.Apr,
19/4/2026,14,Apr,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,Payment for 13th April,"R2,000",,4,4.Apr,
19/4/2026,14,Apr,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,4,4.Apr,
19/4/2026,14,Apr,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,4,4.Apr,
19/4/2026,17,Apr,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,4,4.Apr,
19/4/2026,14,Apr,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,4,4.Apr,
19/4/2026,14,Apr,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R1,143",,4,4.Apr,
19/4/2026,14,Apr,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R2,000",,4,4.Apr,
20/4/2026,14,Apr,2026,CR03,VW,Kombi,MG 81 DR GP,Kombi Cambox Deposit,,"R20,000",4,4.Apr,
20/4/2026,14,Apr,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,Penalty Charges,R500,,4,4.Apr,
21/4/2026,14,Apr,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,Service,,"R3,000",4,4.Apr,"90,000"
21/4/2026,14,Apr,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,Service,,"R3,000",4,4.Apr,"113,000"
21/4/2026,14,Apr,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,Service,,"R3,000",4,4.Apr,"79,000"
21/4/2026,17,Apr,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,Service,,"R3,000",4,4.Apr,"70,000"
21/4/2026,14,Apr,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,Service,,"R3,000",4,4.Apr,"65,000"
23/4/2026,14,Apr,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,4,4.Apr,
23/4/2026,14,Apr,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,4,4.Apr,
23/4/2026,14,Apr,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,4,4.Apr,
23/4/2026,17,Apr,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,4,4.Apr,
23/4/2026,14,Apr,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,4,4.Apr,
23/4/2026,14,Apr,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,4,4.Apr,
23/4/2026,14,Apr,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,,"R2,000",,4,4.Apr,
23/4/2026,14,Apr,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R2,000",,4,4.Apr,
4/5/2026,15,May,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,5,5.May,
4/5/2026,15,May,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,5,5.May,
4/5/2026,15,May,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,5,5.May,
4/5/2026,15,May,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,5,5.May,
4/5/2026,15,May,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R2,000",,5,5.May,
8/5/2026,15,May,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,Front Tyre Replacement,,"R3,540",5,5.May,
9/5/2026,15,May,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,5,5.May,
9/5/2026,15,May,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,5,5.May,
9/5/2026,15,May,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,5,5.May,
9/5/2026,15,May,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,5,5.May,
9/5/2026,15,May,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R2,000",,5,5.May,
11/5/2026,15,May,2026,CR03,VW,Kombi,MG 81 DR GP,Kombi Injectors,,"R10,800",5,5.May,
18/5/2026,15,May,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,5,5.May,
18/5/2026,15,May,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,5,5.May,
18/5/2026,21,May,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,5,5.May,
18/5/2026,15,May,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,5,5.May,
18/5/2026,15,May,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,,"R2,000",,5,5.May,
24/5/2026,15,May,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,5,5.May,
24/5/2026,22,May,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,5,5.May,
24/5/2026,15,May,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R2,000",,5,5.May,
24/5/2026,15,May,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,5,5.May,
25/5/2026,15,May,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,Front Tyre Replacement,,"R3,540",5,5.May,
25/5/2026,15,May,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,Service,,"R3,000",5,5.May,85000
25/5/2026,15,May,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,5,5.May,
25/5/2026,15,May,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,5,5.May,
26/5/2026,15,May,2026,CR03,VW,Kombi,MG 81 DR GP,Kombi Repair Balance,,"R12,000",5,5.May,
28/5/2026,15,May,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,Brake Pads,,"R1,350",5,Key,74845
31/5/2026,15,May,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R1,148",,5,5.May,
31/5/2026,15,May,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,5,5.May,
31/5/2026,23,May,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,5,5.May,
31/5/2026,15,May,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R2,000",,5,5.May,
31/5/2026,15,May,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,5,5.May,
31/5/2026,15,May,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,5,5.May,
2/6/2026,16,Jun,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,Ride-Hailing Issue,,"R4,870",6,6.Jun,
2/6/2026,16,Jun,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,Rims Repair,,R500,6,6.Jun,
6/6/2026,16,Jun,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,6,6.Jun,
6/6/2026,16,Jun,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,6,6.Jun,
6/6/2026,23,Jun,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,6,6.Jun,
6/6/2026,16,Jun,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,6,6.Jun,
6/6/2026,16,Jun,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R2,000",,6,6.Jun,
8/6/2026,16,Jun,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,Front Tyre Replacement,,"R3,540",6,6.Jun,
8/6/2026,16,Jun,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,Service,,"R3,000",6,6.Jun,67000
10/6/2026,16,Jun,2026,,,,,Loan Limuor,,"R13,000",6,6.Jun,
12/6/2026,16,Jun,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,Court Release Fees,,"R1,300",6,6.Jun,
14/6/2026,25,Jun,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,6,6.Jun,
14/6/2026,16,Jun,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,6,6.Jun,
14/6/2026,16,Jun,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,6,6.Jun,
14/6/2026,16,Jun,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,6,6.Jun,
14/6/2026,16,Jun,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,6,6.Jun,
14/6/2026,16,Jun,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R2,000",,6,6.Jun,
17/6/2026,16,Jun,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,Brake Pads,,"R1,350",6,6.Jun,87666
24/6/2026,26,Jun,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,6,6.Jun,
24/6/2026,16,Jun,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,6,6.Jun,
24/6/2026,16,Jun,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,6,6.Jun,
24/6/2026,16,Jun,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,6,6.Jun,
24/6/2026,16,Jun,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,6,6.Jun,
24/6/2026,16,Jun,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R1,385",,6,6.Jun,
24/6/2026,16,Jun,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,,"R2,000",,6,6.Jun,
30/6/2026,27,Jun,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,6,6.Jun,
30/6/2026,16,Jun,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,6,6.Jun,
30/6/2026,16,Jun,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,6,6.Jun,
30/6/2026,16,Jun,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,6,6.Jun,
30/6/2026,16,Jun,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,6,6.Jun,
30/6/2026,16,Jun,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,,"R2,000",,6,6.Jun,
2/7/2026,17,Jul,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,Double Disc Inspection and Roadworthy,,"R3,350",7,7.Jul,
4/7/2026,17,Jul,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,Spare Wheel Jack,,"R2,235",7,7.Jul,
6/7/2026,28,Jul,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,R858,,7,7.Jul,
6/7/2026,17,Jul,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,R858,,7,7.Jul,
6/7/2026,17,Jul,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,R858,,7,7.Jul,
6/7/2026,17,Jul,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,R858,,7,7.Jul,
6/7/2026,17,Jul,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,R858,,7,7.Jul,
6/7/2026,17,Jul,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,,R858,,7,7.Jul,
7/7/2026,17,Jul,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,Double Disc Inspection and Roadworthy,,"R3,350",7,7.Jul,
7/7/2026,17,Jul,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,Service,,"R3,000",7,7.Jul,85000
9/7/2026,17,Jul,2026,ALLCR,,,,Blocked tickets,,"R1,980",7,7.Jul,
12/7/2026,17,Jul,2026,ALLCR,,,,,,R487,7,7.Jul,
13/7/2026,17,Jul,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,Front Tyre Replacement,,"R3,540",7,7.Jul,
13/7/2026,17,Jul,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,Rear Tyre Replacement,,"R3,540",7,7.Jul,
13/7/2026,17,Jul,2026,CR03,VW,Kombi,MG 81 DR GP,Kombi Disc Renewal,,"R2,540",7,7.Jul,
13/7/2026,17,Jul,2026,,,,,Loan Repaid Bongile 7000/13000,"R7,000",,7,7.Jul,
17/7/2026,17,Jul,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,Brake Pads,,"R1,350",7,7.Jul,77177
20/7/2026,17,Jul,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,Release Fee,,"R4,500",7,7.Jul,
20/7/2026,17,Jul,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,,"R2,000",,7,7.Jul,
20/7/2026,17,Jul,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,7,7.Jul,
20/7/2026,17,Jul,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,7,7.Jul,
20/7/2026,17,Jul,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,7,7.Jul,
20/7/2026,30,Jul,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,7,7.Jul,
20/7/2026,17,Jul,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R2,000",,7,7.Jul,
21/7/2026,17,Jul,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,Service,,"R3,000",7,7.Jul,65000
21/7/2026,17,Jul,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,Fan Repair,,"R2,850",7,7.Jul,
22/7/2026,17,Jul,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,Fan Repair Extra,,R827,7,7.Jul,
25/7/2026,17,Jul,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,Battery Replacement,,"R1,610",7,7.Jul,
27/7/2026,17,Jul,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,Service,,"R3,000",7,7.Jul,112000
27/7/2026,17,Jul,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,R857,,7,7.Jul,
27/7/2026,17,Jul,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R1,714",,7,7.Jul,
27/7/2026,17,Jul,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,7,7.Jul,
27/7/2026,17,Jul,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,7,7.Jul,
27/7/2026,31,Jul,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,7,7.Jul,
27/7/2026,17,Jul,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,7,7.Jul,
27/7/2026,17,Jul,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,,"R2,000",,7,7.Jul,
27/7/2026,17,Jul,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R2,000",,7,7.Jul,
29/7/2026,17,Jul,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,Battery Replacement,,"R1,610",7,7.Jul,
4/8/2026,32,Aug,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,Release Fee,,"R3,640",8,8.Aug,
4/8/2026,32,Aug,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,Front Tyre Replacement,,"R3,540",8,8.Aug,
4/8/2026,32,Aug,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,Rear Tyre Replacement,,"R3,540",8,8.Aug,
4/8/2026,32,Aug,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,Service,,"R3,000",8,8.Aug,90000
4/8/2026,32,Aug,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,Release Fee,,R500,8,8.Aug,
5/8/2026,32,Aug,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,Brake Pads,,"R1,350",8,8.Aug,90617
5/8/2026,32,Aug,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,Bongile,,"R1,000",8,8.Aug,
9/8/2026,33,Aug,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,Brake Pads,,"R1,350",8,8.Aug,131723
10/8/2026,33,Aug,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,Service,,"R3,000",8,8.Aug,135000
10/8/2026,33,Aug,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,8,8.Aug,
10/8/2026,33,Aug,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,8,8.Aug,
10/8/2026,33,Aug,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R1,429",,8,8.Aug,
10/8/2026,33,Aug,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,8,8.Aug,
10/8/2026,33,Aug,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,8,8.Aug,
10/8/2026,33,Aug,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,8,8.Aug,
10/8/2026,33,Aug,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,,"R2,000",,8,8.Aug,
10/8/2026,33,Aug,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R2,000",,8,8.Aug,
12/8/2026,33,Aug,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,Brake Pads,,"R1,350",8,8.Aug,116072
12/8/2026,33,Aug,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,Brake Pads,,"R1,350",8,8.Aug,98401
12/8/2026,33,Aug,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,Brake Pads,,"R1,350",8,8.Aug,93016
15/8/2026,33,Aug,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,Battery Replacement,,"R1,610",8,8.Aug,
15/8/2026,33,Aug,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,Brake Pads,,R950,8,8.Aug,135169
15/8/2026,33,Aug,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,Brake Disc,,R810,8,8.Aug,
17/8/2026,34,Aug,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,8,8.Aug,
17/8/2026,34,Aug,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,,"R2,000",,8,8.Aug,
17/8/2026,34,Aug,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,8,8.Aug,
17/8/2026,34,Aug,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,8,8.Aug,
17/8/2026,34,Aug,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,8,8.Aug,
17/8/2026,34,Aug,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,8,8.Aug,
17/8/2026,34,Aug,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,,"R2,000",,8,8.Aug,
17/8/2026,34,Aug,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R2,000",,8,8.Aug,
24/8/2026,35,Aug,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,Release Fee,,"R3,950",8,8.Aug,
24/8/2026,35,Aug,2026,CR02,Suzukki,S PRESSO,ML 85 NG GP,Labour for Disc,,R350,8,8.Aug,
25/8/2026,35,Aug,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,Rear Tyre Replacement,,"R3,540",8,8.Aug,
25/8/2026,35,Aug,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,Rear Tyre Replacement,,"R3,540",8,8.Aug,
25/8/2026,35,Aug,2026,CR01,Suzukki,S PRESSO,ML 47 SY GP,,"R2,000",,8,8.Aug,
25/8/2026,35,Aug,2026,CR04,Suzukki,S PRESSO,MN 81 MC GP,,"R2,000",,8,8.Aug,
25/8/2026,35,Aug,2026,CR05,Suzukki,S PRESSO,LP 66 LB GP,,"R2,000",,8,8.Aug,
25/8/2026,35,Aug,2026,CR06,Suzukki,S PRESSO,MR 65 SW GP /BR 47 TY ZN,,"R2,000",,8,8.Aug,
25/8/2026,35,Aug,2026,CR07,Suzukki,S PRESSO,MS 29 BZ GP,,"R2,000",,8,8.Aug,
25/8/2026,35,Aug,2026,CR08,Suzukki,S PRESSO,MW 07 YY GP / BT 23 JK ZN,,"R2,000",,8,8.Aug,
25/8/2026,35,Aug,2026,CR09,Suzukki,S PRESSO,MW 07 ZG GP / BR 43 XC ZN,,"R2,000",,8,8.Aug,`;

function parseAmount(val: string): number {
  if (!val) return 0;
  // Remove quotes, 'R', commas
  const cleaned = val.replace(/["R, ]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : Math.round(parsed * 100); // to cents
}

function parseDate(val: string): Date | null {
  if (!val) return null;
  const parts = val.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);
    return new Date(Date.UTC(year, month, day));
  }
  return null;
}

function mapCategory(expenseType: string, incomeAmt: number, expenseAmt: number): Category {
  const t = expenseType.toLowerCase();

  if (t.includes('uber fees') || t.includes('uber')) return Category.UberFees;
  if (t.includes('service')) return Category.Service;
  if (t.includes('brake') || t.includes('disc')) return Category.BrakePads;
  if (t.includes('tyre')) return Category.Tyres;
  if (t.includes('repair') || t.includes('cambox') || t.includes('injector') || t.includes('battery')) return Category.Repairs;
  if (t.includes('license') || t.includes('roadworthy') || t.includes('cert')) return Category.License;
  if (t.includes('insurance') || t.includes('release') || t.includes('penalty') || t.includes('loan') || t.includes('ticket')) return Category.Other;
  if (t.includes('fuel') || t.includes('petrol') || t.includes('tank')) return Category.Fuel;
  if (t.includes('wheel') || t.includes('jack')) return Category.Maintenance;
  if (t.includes('meter taxi') || t.includes('payment')) return Category.Income;

  // Defaults
  if (incomeAmt > 0 && expenseAmt === 0) return Category.Income;

  return Category.Other;
}

async function run() {
  console.log("Parsing CSV data...");
  const lines = rawCsv.split('\n');

  const vehiclesMap = new Map();
  const transactions = [];

  // Skip header, skip empty/garbage lines
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.startsWith(',')) continue;

    // Simple CSV parser for quoted fields
    const cols = [];
    let cur = '';
    let inQuotes = false;
    for (let char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cols.push(cur);
        cur = '';
      } else {
        cur += char;
      }
    }
    cols.push(cur); // last col

    if (cols.length < 13) continue;

    const [dateStr, week, month, year, vehicleId, make, model, reg, expenseType, incomeStr, expenseStr, srNo, key, mileageStr] = cols;

    // Map Vehicle
    if (vehicleId && vehicleId !== 'ALLCR' && vehicleId !== '') {
      if (!vehiclesMap.has(vehicleId)) {
        let reg1 = reg || 'UNKNOWN';
        let reg2 = null;
        if (reg1.includes('/')) {
          const parts = reg1.split('/');
          reg1 = parts[0].trim();
          reg2 = parts[1].trim();
        }

        vehiclesMap.set(vehicleId, {
          id: vehicleId,
          make: make || 'Unknown',
          model: model || 'Unknown',
          registration: reg1,
          registration2: reg2,
          transmission: 'Manual',
          purchaseDate: new Date('2025-01-01T00:00:00Z'),
          purchasePriceCents: 10000000,
          mileageAtPurchaseKm: 0,
          currentMileageKm: 50000,
        });
      }
    }

    // Map Transaction
    const date = parseDate(dateStr);
    if (!date) continue;

    const incomeCents = parseAmount(incomeStr);
    const expenseCents = parseAmount(expenseStr);

    if (incomeCents === 0 && expenseCents === 0) continue; // skip blank rows

    const category = mapCategory(expenseType || '', incomeCents, expenseCents);

    let mileage = parseInt((mileageStr || '').replace(/[" ,]/g, ''), 10);
    if (isNaN(mileage)) mileage = null;

    transactions.push({
      date,
      vehicleId: (vehicleId === '' || vehicleId === 'ALLCR') ? 'ALLCR' : vehicleId,
      category,
      incomeZarCents: incomeCents,
      expenseZarCents: expenseCents,
      notes: expenseType || null,
      mileageKm: mileage
    });
  }

  console.log(`Found ${vehiclesMap.size} vehicles and ${transactions.length} transactions.`);

  console.log("Clearing existing data...");
  await prisma.transaction.deleteMany();
  await prisma.vehicleNote.deleteMany();
  await prisma.mileageEntry.deleteMany();
  await prisma.vehicle.deleteMany();

  console.log("Inserting vehicles...");
  for (const v of vehiclesMap.values()) {
    await prisma.vehicle.create({ data: v });
  }

  console.log("Inserting transactions...");
  await prisma.transaction.createMany({
    data: transactions
  });

  console.log("Seed complete! All your custom Excel data has been inserted seamlessly.");
}

run()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
