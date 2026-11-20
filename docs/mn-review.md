# Mongolian UI text review (itours.mn)

Review only: no source file was changed. Reviewed on 2026-11-20.

Path short-hands used in the table:

- `fe/mn.ts`: `front-end/lib/i18n/locales/mn.ts` (compared key by key with `en.ts`)
- `be/mn.ts`: `back-end/src/utils/i18n/locales/mn.ts` (compared with its `en.ts`)
- `seed`: `back-end/src/seeds/demo.seed.ts`

## Summary

| Severity | Count |
|---|---|
| **High**: wrong or misleading meaning, or missing translation | 5 |
| **Medium**: calque, inconsistency, button convention, broken interpolation | 43 |
| **Low**: typo, grammar slip, punctuation | 25 |
| **Total** | **73** |

Automated checks:

- **Key parity:** front-end 708/708 keys and back-end 77/77 keys. No key is missing in either direction.
- **Placeholders:** every `{placeholder}` name in mn matches en. The problems are the case suffixes glued to placeholders (see the rows on `seatsOf`, `travelled`, `payLead`, `escrowNote`, `gapText` and `orders.email`).
- **Mixed scripts:** a regex search for Latin letters inside Cyrillic words, and for non-Mongolian Cyrillic letters (і, ї, є, ұ, ғ, қ, ң, һ, ә, ў), found **0 hits**. The only match was a regex character class at `front-end/lib/plan/places.ts:75`, which is not UI text.
- **Still in English:** `book.QPAY` and `orders.method.QPAY` are brand names, so they are fine. `admin.brand` is still in English (Low row below).

## Findings

| file:line | key | en | current mn | Асуудал | suggested mn | severity |
|---|---|---|---|---|---|---|
| be/mn.ts:21 | response.booked | Booked — see you on the trip | Захиалга баталгаажлаа | Карт/QPay-ээр төлөхөд захиалга PAID төлөвтэй, компани хараахан баталгаажуулаагүй (booking.controller.ts:184). "Баталгаажлаа" нь CONFIRMED төлөвийн нэр тул аялагчийг төөрөгдүүлнэ. | Төлбөр орлоо — компани удахгүй баталгаажуулна | **High** |
| fe/mn.ts:252, 583, 584 | plan.honestSummary, editor.summaryEn, editor.summaryMn | Honest summary (— EN / — MN) | Шударга товчлол (— Англи / — Монгол) | "Товчлол" нь үгийн товчлол (abbreviation) гэсэн үг. Хураангуй/тойм гэсэн утга өгөхгүй. Төлөвлөгөө бүрийн гарчиг дээр харагдана. | Шударга тойм / Шударга тойм — Англи / Шударга тойм — Монгол | **High** |
| fe/mn.ts:613 | editor.groupPrice | Group price pp | Бүлгийн үнэ | "pp" (нэг хүнд) орхигдсон. Компани бүлгийн нийт үнийг оруулж, үнэ буруу тооцогдох эрсдэлтэй. | Бүлгийн үнэ, нэг хүнд | **High** |
| fe/mn.ts:608 | editor.resets | resets | шинэчлэгдэнэ | Үнэлгээтэй мөрийг засахад тэр мөрийн үнэлгээ устдаг. "Шинэчлэгдэнэ" нь "шинэ болно, сайжирна" гэж ойлгогдох тул өгөгдөл алдагдах аюулыг нуудаг. Гэтэл gapFix (498) "шинээр эхэлнэ" гэж зөв хэлсэн. | үнэлгээ тэглэгдэнэ | **High** |
| seed:311–320 (and the `claims`, `days`, `included`, `excluded` of every plan) | — | Two 6–7 h driving days; Long-drop toilet at the herder ger … | — (монгол хувилбар алга) | Сул тал, давуу тал, өдөр тутмын хөтөлбөр зөвхөн англиар бичигдсэн. ClaimModel болон PlanDayModel-д Mn талбар байхгүй (зөвхөн plan.model.ts:20, 32-т titleMn, summaryMn бий). Тиймээс монгол хэрэглэгч checkout дээр "уншсан гэдгээ баталгаажуулна уу" гэж шаардагдах сул талуудыг англиар уншина. | Загварт `textMn`/`detailMn` (өдөрт `titleMn`/`descriptionMn`) нэмж, seed-д орчуулга оруулах. Жишээ: "Хоёр өдөр 6–7 цаг замд явна" | **High** |
| fe/mn.ts:18 | common.done | Done | Болсон | Товч (plan-editor.tsx:481, operator-form-dialog.tsx:122) бусад товчны адил -х үйлт нэрээр байх ёстой. "Болсон" нь төлөв илэрхийлдэг. | Дуусгах | Medium |
| fe/mn.ts:107 | home.bestMatched | Best matched trips | Хамгийн сайн тохирох аяллууд | Англи хувилбарын утга нь "төлөвлөгөөтэйгөө хамгийн сайн нийцсэн". Монгол хувилбар нь "танд тохирох" гэж ойлгогдоно. | Төлөвлөгөөндөө хамгийн сайн нийцсэн аяллууд | Medium |
| fe/mn.ts:110 | home.step1 | Compare on honesty | Шударга байдлаар харьцуул | "Шударгаар харьцуул" буюу хэрэглэгч шударга харьцуулах гэсэн утга болсон. Угтаа аяллуудыг шударга байдлаар нь харьцуулах ёстой. | Шударга байдлаар нь харьцуул | Medium |
| fe/mn.ts:114 | home.step3 | Arrive without surprises | Гэнэтийн зүйлгүй хүрээд оч | "Хүрээд оч" нь "зочлоод ир" гэсэн хэлц. "Arrive" үгийн шууд орчуулга. | Гэнэтийн зүйлгүй аялаарай | Medium |
| fe/mn.ts:128, 179 | home.exploreKicker, home.footerExplore | Explore by region / Explore | Бүсээр нь судлах / Судлах | "Судлах" нь эрдэм шинжилгээний утгатай. "Explore" үгийн шууд орчуулга. | Бүс нутгаар нь сонгох / Аялал | Medium |
| fe/mn.ts:129 | home.exploreTitle | Where in Mongolia? | Монголын хаана? | Үйл үггүй шууд орчуулга. | Монголын хаагуур аялах вэ? | Medium |
| fe/mn.ts:172 | home.escrowTitle | Your money waits until the trip is over | Аялал дуустал таны мөнгө хүлээнэ | "Мөнгө хүлээнэ" гэдэг нь мөнгийг хүн мэт хүлээлгэсэн шууд орчуулга. | Аялал дуустал таны төлбөр бидэнд хадгалагдана | Medium |
| fe/mn.ts:173 | home.escrowText | …so promises are kept before anyone is paid. | …Амлалт биелсний дараа л хэн нэгэн мөнгөө авна. | "Хэн нэгэн мөнгөө авна" гэвэл аялагч ч байж болох тул хэн авах нь тодорхойгүй. | Бид төлбөрийг хадгалж, аялал дууссаны маргааш компанид шилжүүлдэг. Ингэснээр компани амлалтаа биелүүлсний дараа л мөнгөө авна. | Medium |
| fe/mn.ts:163, 205; seed:786 | home.monthNotes.m10, regions.WEST.highlights, summaryMn | Golden Eagle Festival (in the Altai) | Алтайн Бүргэдийн баяр / Бүргэдийн баяр / Алтан бүргэдийн наадам | Нэг баярыг гурван янзаар нэрлэсэн. m10-д "Golden" орхигдож, "Бүргэдийн" үг өгүүлбэрийн дунд том үсгээр эхэлсэн. | m10: Алтайд Алтан бүргэдийн баяр; highlights: …\|Алтан бүргэдийн баяр; seed: …10-р сарын эхээр Алтан бүргэдийн баярыг үзнэ. | Medium |
| fe/mn.ts:223 | plan.seatsOf | {n} of {total} seats left | {total}-аас {n} суудал үлдсэн | Тоонд залгах -аас нөхцөл тооны дуудлагаас хамаарна: 4-өөс, 6-гаас, 12-оос, 2-оос. Seed-д 4, 6, 12 суудалтай гаралт бий. | {total} суудлаас {n} нь үлдсэн | Medium |
| fe/mn.ts:245 | plan.repliesIn | replies in ~{h} h | ~{h} цагт хариулдаг | "~11 цагт хариулдаг" нь "11 цагийн үед хариулдаг" гэж уншигдана (Blue Pearl-ийн replyHours = 11). | ~{h} цагийн дотор хариулдаг | Medium |
| fe/mn.ts:266 | plan.noTransfer | No transfer | Шилжилтгүй | "Шилжилт" хийсвэр үг тул машинаар явахгүй өдөр гэж ойлгогдохгүй. | Замд гарахгүй | Medium |
| fe/mn.ts:282 | plan.travelled | Travelled {d} · verified booking | {d}-д аялсан · баталгаат захиалга | {d} нь "2026.09.19" хэлбэртэй. Өдрийн тооноос хамаараад 19-нд, 01-нд, 02-т, 03-т болох тул "-д" ихэнх өдөрт буруу. "Баталгаат" гэдэг нь глоссаритай зөрнө. | Аялсан: {d} · баталгаажсан захиалга | Medium |
| fe/mn.ts:295 | plan.groupDiscount | price drops to {p} pp at {n} travellers | {n} аялагчтай бол нэг хүнд {p} болж буурна | "Яг n хүнтэй бол" гэж ойлгогдоно. Үнэндээ n буюу түүнээс олон хүн гэсэн утгатай (editor.groupFrom "…N аялагчаас"). Мөнгөтэй холбоотой. | {n} ба түүнээс олон аялагчтай бол нэг хүнд {p} болж буурна | Medium |
| fe/mn.ts:296 | plan.cancelPolicy | Free cancellation until {d}, then 50%. Paid to itours escrow, … | {d} хүртэл үнэгүй цуцална, дараа нь 50%. Төлбөр itours-ийн эскроу … | "Цуцална" нь "(бид) цуцална" гэсэн мэдэгдэл болжээ. "Дараа нь 50%" нь торгууль уу, буцаалт уу тодорхойгүй (refundHalf-д 50%-ийг буцаана гэсэн). "Айтурс" гэдэг үг арын эгшигтэй тул "-ийн" биш "-ын" болно. | {d} хүртэл үнэгүй цуцлах боломжтой, түүнээс хойш төлбөрийн 50%-ийг буцаана. Төлбөр itours-ын эскроу дансанд хадгалагдаж, аялал дууссаны маргааш компанид шилжинэ. | Medium |
| fe/mn.ts:299 | plan.scoreHowText | …Placement can't be bought. | …Байршлыг мөнгөөр худалдаж авах боломжгүй. | "Байршил" нь газарзүйн байршил гэсэн үг. Энд жагсаалт дахь эрэмбийг хэлж байна. | …Эрэмбэд дээгүүр орохыг мөнгөөр худалдаж авах боломжгүй. | Medium |
| fe/mn.ts:332 | search.rankingNote | Sponsored placement is not sold. Ranking blends Expectation Score, review count and price. | Төлбөртэй байршуулалт байхгүй. Эрэмбэ нь хүлээлтийн оноо, сэтгэгдлийн тоо, үнийг нэгтгэнэ. | "Байршуулалт" (байршуулах = upload/host) энэ утгаар утгагүй. | Мөнгө төлж эрэмбэ ахиулах боломжгүй. Эрэмбийг хүлээлтийн оноо, сэтгэгдлийн тоо, үнээр тооцно. | Medium |
| fe/mn.ts:324 | search.db.drive | Max 5 h driving/day | Өдөрт ихдээ 5 цаг жолоодлого | "Жолоодлого" нь жолоо барих үйлдэл тул аялагч өөрөө жолоодох мэт ойлгогдоно. Бусад газар "{h} цаг зам" гэж бичсэн. | Өдөрт ихдээ 5 цаг зам | Medium |
| fe/mn.ts:346 | book.payLead | itours holds your payment and pays {op} the day after… | …аялал дууссаны маргааш {op}-д шилжүүлнэ… | "Steppe & Sky Tours-д", "Khangai Expeditions-д" нь с үсгээр төгсөх тул "-т" авах ёстой. Нөхцлийг нэр үгэнд залгах нь илүү найдвартай. | Төлбөрийг itours хадгалж, аялал дууссаны маргааш {op} компанид шилжүүлнэ. {d} хүртэл үнэгүй цуцалбал төлбөрийг бүрэн буцаан олгоно. | Medium |
| fe/mn.ts:365 | book.escrowNote | Held in escrow, released to {op} the day after the trip ends. | Эскроу дансанд хадгалагдаж, аялал дууссаны маргааш {op}-д шилжинэ. | Дээрхтэй адил {op}-д нөхцлийн алдаа. | Эскроу дансанд хадгалагдаж, аялал дууссаны маргааш {op} компанид шилжинэ. | Medium |
| fe/mn.ts:359 | book.confirmRead | Before you pay, the operator wants you to confirm you've read: | Төлөхөөс өмнө компани таныг дараахыг уншсан эсэхийг баталгаажуулахыг хүсэж байна: | Заахын тийн ялгал дөрвөн удаа давхарласан шууд орчуулга. | Төлөхөөсөө өмнө компанийн анхааруулсан дараах зүйлсийг уншсан гэдгээ баталгаажуулна уу: | Medium |
| fe/mn.ts:352, 367 | book.BANKSub, book.holdSeats | We hold your seats for 24 hours… / Hold my seats for 24 h | Суудлыг 24 цаг хадгална… / Суудлаа 24 цаг хадгалуулах | "Хадгалах" үгийг аль хэдийн Save товч, хадгалсан төлөвлөгөө, эскроу гэсэн гурван утгаар хэрэглэж байна. Суудал түр барих нь өөр ойлголт. Back-end-д "барина", trip хэсэгт "түр хадгаллаа" гэж холилдсон. | Суудлыг тань 24 цаг түр барина. Энэ хугацаанд шилжүүлэг орохгүй бол суудал дахин худалдаанд гарна. / Суудлаа 24 цаг түр бариулах | Medium |
| fe/mn.ts:378 | trip.heldLead | Transfer {p} by {time} (Ulaanbaatar time) and use order {code} as the payment reference… | Суудлаа хадгалуулахын тулд {p} шилжүүлнэ үү… Гүйлгээний утгад {code} гэж бичнэ… | Суудал аль хэдийн түр барьсан, шилжүүлэг нь баталгаажуулахад зориулагдсан. "Хадгалуулахын тулд" гэвэл хараахан бариагүй мэт ойлгогдоно. "Бичнэ" нь заавар учир "бичнэ үү" байх ёстой. | Суудлаа баталгаажуулахын тулд {time} (Улаанбаатарын цагаар) хүртэл {p} шилжүүлнэ үү. Гүйлгээний утгад {code} гэж бичнэ үү. Хугацаандаа мөнгө орохгүй бол суудал дахин худалдаанд гарна. | Medium |
| fe/mn.ts:417 | trips.stage.PAID | Paid · awaiting operator | Төлсөн · компани хүлээж буй | "Компани ямар нэг юм хүлээж байна" гэж уншигдах хоёрдмол утгатай. | Төлсөн · компанийн баталгаажуулалт хүлээж буй | Medium |
| fe/mn.ts:422 | trips.stage.EXPIRED | Hold expired | Хугацаа дууссан | "Hold" гэдэг орхигдсон тул аялал дууссан мэт ойлгогдоно (COMPLETED нь "Дууссан"). | Түр барих хугацаа дууссан | Medium |
| fe/mn.ts:449 | compare.title | Your saved plans, side by side | Хадгалсан төлөвлөгөөнүүд зэрэгцээ | Үйл үггүй бөгөөд "зэрэгцээ" төгсгөлд нь өлгөгдсөн шууд орчуулга. | Хадгалсан төлөвлөгөөнүүдээ зэрэгцүүлж харах | Medium |
| fe/mn.ts:485 | partner.confirmedBookings | Confirmed bookings | Баталгаат захиалга | Бусад бүх газарт "Баталгаажсан" гэж бичсэн. "Баталгаат" нь "баталгаатай (warranty)" гэсэн өнгө аястай. | Баталгаажсан захиалга | Medium |
| fe/mn.ts:497 | partner.gapText | On "{plan}", {m} of {total} travellers said "{claim}" did not fully hold. | "{plan}" төлөвлөгөөнд {total}-аас {m} аялагч "{claim}" амлалт бүрэн биелээгүй гэжээ. | {total}-аас нөхцлийн алдаа seatsOf мөртэй адил. "{claim}" нь сул тал ч байж болох тул "амлалт" гэдэг үг үргэлж тохирохгүй. | "{plan}" төлөвлөгөөний {total} аялагчийн {m} нь "{claim}" бүрэн биелээгүй гэжээ. | Medium |
| fe/mn.ts:510 | partner.allPlans | All {n} plans | Бүх {n} | Нэр үг орхигдсон тул "Бүх 9" гэх утгагүй холбоос гарна. | Бүх {n} төлөвлөгөө | Medium |
| fe/mn.ts:512 | partner.conversion | Conv. | Хөрвүүлэлт | "Хөрвүүлэлт" нь файл, валют хөрвүүлэх гэсэн утгатай, маркетингийн conversion биш. | Захиалгын хувь | Medium |
| fe/mn.ts:544 | orders.transferReceived | Transfer received | Шилжүүлэг орсон | Буцаах боломжгүй үйлдлийн товч (orders-view.tsx:387, 391) төлөв мэт уншигдана. Мөнгө аль хэдийн орсон гэж компанийг төөрөгдүүлж болно. | Шилжүүлэг орсныг тэмдэглэх | Medium |
| fe/mn.ts:549 | orders.email | Email {name} | {name}-д имэйл бичих | Нэр с, р, т, к үсгээр төгсвөл "-т/-ад" авна (Jonas → Жонаст, Ochirbat → Очирбатад). | Имэйл бичих: {name} | Medium |
| fe/mn.ts:569 | editor.saveDraft | Save draft | Хадгалах | "Draft" орхигдсон. Нийтлэгдсэн төлөвлөгөөн дээр "Хадгалах" дарвал өөрчлөлт шууд нийтлэгдэнэ гэж ойлгогдоно. | Ноорог хадгалах | Medium |
| fe/mn.ts:575, 576 | editor.region, editor.area | Region (province) / Area | Бүс (аймаг) / Чиглэл | search.region болон operatorPage дээр "Бүс" гэдэг нь Говь, Хойд гэх мэт area-г хэлдэг. Editor-т харин "Бүс" нь аймаг, area нь "Чиглэл" болжээ. | Аймаг / Бүс | Medium |
| fe/mn.ts:615 | editor.singleSupplement | Single supplement | Ганц өрөөний нэмэгдэл | plan.SINGLE, plan.single-д "Ганц хүний" гэж бичсэн. "Ганц өрөө" гэвэл "ганцхан өрөө" гэж ойлгогдоно. | Ганц хүний өрөөний нэмэгдэл | Medium |
| fe/mn.ts:626; be/mn.ts:68 | editor.uploading, error.uploadFailed | Uploading… / Upload failed | Хуулж байна… / Файл хуулахад алдаа гарлаа | "Хуулах" нь common.copy (Copy)-ийн орчуулга. Upload-д хэрэглэвэл хуулбарлаж байгаа мэт ойлгогдоно. | Байршуулж байна… / Файл байршуулахад алдаа гарлаа | Medium |
| fe/mn.ts:676 | admin.approve | Approve | Зөвшөөрөх | approveNeeds-д "батлах" гэж бичсэн. "Зөвшөөрөл" нь тусгай зөвшөөрөл (licence)-тэй давхцана. | Батлах | Medium |
| fe/mn.ts:685 | admin.unverify | Unverify | Цуцлах | Юуг цуцлах нь тодорхойгүй тул компанийг устгах мэт ойлгогдоно. Back-end-ийн response.unverified "Баталгаажуулалтыг цуцаллаа" зөв байна. | Баталгаажуулалт цуцлах | Medium |
| fe/mn.ts:686, 688, 689, 703, 705; be/mn.ts:12, 14, 46, 47, 48, 49 | admin.addOperator, operatorForm.*, response.verified, response.operatorCreated, error.companyRequired, notAnOperator, operatorNotFound, operatorNotVerified | Operator / agency | Байгууллага | Бусад бүх UI-д operator нь "компани", "аяллын компани". Admin хэсэг болон API мессежүүд "байгууллага" гэж хэрэглэдэг. 689-р мөрөнд нэг өгүүлбэрт хоёулаа орсон. | 686/703: Компани нэмэх; 688: Аяллын компани нэмэх; 689: Өөрөө бүртгүүлээгүй компанид: компани болон анхны нэвтрэх эрхийг нь үүсгээд, нэвтрэх мэдээллийг хүлээлгэн өгнө.; 705: …компанид илгээнэ үү…; be:12 Компанийг баталгаажууллаа; be:14 Компани нэмэгдлээ; be:46 Аяллын компанийн нэр шаардлагатай; be:47 Энэ бүртгэл компанитай холбогдоогүй байна; be:48 Компани олдсонгүй; be:49 Эхлээд компанийг баталгаажуулна уу | Medium |
| be/mn.ts:19, 50, 52 | response.planApproved, error.planNotFound, error.planNotPending | Plan published / Plan not found / This plan is not waiting for review | Аяллыг нийтэллээ / Аялал олдсонгүй / Энэ аялал хянагдахаар хүлээгдээгүй байна | Front-end-д plan нь "төлөвлөгөө", аялал нь trip буюу захиалга. Админ "Аяллыг нийтэллээ"-г захиалгатай холбоотой гэж ойлгож болно. | Төлөвлөгөөг нийтэллээ / Төлөвлөгөө олдсонгүй / Энэ төлөвлөгөө хяналт хүлээгээгүй байна | Medium |
| be/mn.ts:20 | response.fixesRequested | Sent back to the operator | Байгууллагад засвар буцаалаа | "Засвар буцаалаа" нь "засварыг буцааж өглөө" гэсэн утгагүй хэллэг болжээ. | Засвар хийлгэхээр компанид буцаалаа | Medium |
| seed:548 | summaryMn (gobi-photographers-route-9-days) | A private 4×4 route timed to the light, not to the camps… No hotel nights and no hot showers after Ulaanbaatar. | Гэрлийн цагт тааруулсан хувийн маршрут: … Улаанбаатараас хойш зочид буудал, халуун шүршүүр байхгүй. | "Гэрлийн цаг" гэсэн хэллэг монголд байдаггүй, мөн "not to the camps" орхигдсон. "Улаанбаатараас хойш" нь "Улаанбаатараас хойд зүгт" гэж ч уншигдана, гэтэл Говь урд зүгт байдаг. | Баазад биш, гэрэлд тааруулсан хувийн 4×4 маршрут: алтан цагийн гэрэл хамгийн сайхан газарт майхан барьж, малчин айлд хоёр хононо. Улаанбаатараас гарсны дараа зочид буудал, халуун шүршүүр байхгүй. | Medium |
| seed:600 | summaryMn (central-khangai-hot-springs-7-days) | …comfortable camps. | …тав тухтай кемпүүд. | "Кемп" нь англи үг. UI-д "жуулчны бааз" гэж хэрэглэдэг. | …Хөнгөн алхалт, тав тухтай жуулчны баазууд. | Medium |
| fe/mn.ts:43 | nav.partnerArea | Partner dashboard | Түнш самбар | Харьяалахын тийн ялгал дутуу (705-р мөрний "түнш самбартаа" ч мөн адил). | Түншийн самбар | Low |
| fe/mn.ts:116 | home.footerNote | …bachelor thesis project… | …МУИС-ийн бакалаврын судалгааны ажил… | Тогтсон нэр томьёо нь "бакалаврын төгсөлтийн ажил". | itours.mn — МУИС-ийн бакалаврын төгсөлтийн ажил. Зураг: Wikimedia Commons (CC0 / CC BY). | Low |
| fe/mn.ts:130 | home.exploreLead | …which trips go there. | …ямар аяллууд очдогийг хараарай. | Зөв бичгийн дүрмээр -даг нөхцөл дээр -ийг залгахад эгшиг гээгддэг тул "очдгийг" болно. | …юугаараа алдартай, ямар аяллууд очдгийг хараарай. | Low |
| fe/mn.ts:145 | home.comfortNone | No trip promises all of these yet. Try dropping one. | Эдгээрийг бүгдийг нь амласан аялал… | Заахын тийн ялгал давхарласан. | Эдгээр бүх нөхцөлийг амласан аялал одоогоор алга. Нэгийг нь хасаад үзээрэй. | Low |
| fe/mn.ts:157 | home.monthNotes.m4 | Thaw and dust storms, empty roads | Гэсгээл, шороон шуурга, хоосон зам | "Гэсгээл" стандарт үг биш (гэсгээх = хөлдүү зүйлийг гэсгээх). Байгалийн гэсэлтийг "гэсэлт" гэдэг. | Хаврын гэсэлт, шороон шуурга, хоосон зам | Low |
| fe/mn.ts:205 | regions.WEST.highlights | Tavan Bogd glaciers… | Таван богдын мөсөн гол… | "Таван Богд" бол оноосон нэр тул том үсгээр бичнэ. Баярын нэрийг дээрх Medium мөрийн дагуу засна. | Таван Богдын мөсөн гол\|Бүргэдчид\|Казах айлд хонох\|Алтан бүргэдийн баяр | Low |
| fe/mn.ts:251, 592 | plan.sleeping, editor.sleeping | Sleeping | Хонох | Шошго дангаараа үйл үг болжээ. search.sleepingArrangement, editor.sleepingLine-д "Хонох байр" гэж бичсэн. | Хонох байр | Low |
| fe/mn.ts:258 | plan.scoreExplain | Percentages are itours' own check of the operator's claims against verified post-trip reviews. | Хувь нь компанийн амлалтыг … сэтгэгдэлтэй itours тулгаж тооцсон үр дүн. | Тодотгол өгүүлбэрийн эзэн "itours" ялгалгүй үлдсэн, "own" гэдэг үг орхигдсон. | Хувийг itours өөрөө компанийн амлалтыг аяллын дараах баталгаажсан сэтгэгдэлтэй тулгаж тооцдог. | Low |
| fe/mn.ts:300 | plan.maxOnDate | Max {n} on this date | Энэ гаралтад дээд тал нь {n} | Нэр үг дутуу. | Энэ гаралтад дээд тал нь {n} хүн | Low |
| fe/mn.ts:340 | book.title | Checkout | Төлбөр | 342-р мөрний stepPayment-тэй ижил тул "Алхам 2/3 · Төлбөр" гарчигтай давхардана. | Захиалга хийх | Low |
| fe/mn.ts:353 | book.domestic | Domestic | Дотоод | Тодотгол хэлбэр нь "дотоодын". | Дотоодын | Low |
| fe/mn.ts:406 | trip.paidLead | Payment received and held by itours… | Төлбөр орж, itours-д хадгалагдаж байна… | "Айтурс" с үсгээр төгссөн тул "-т" авна. Брэндийн нэрэнд нөхцөл залгахгүй байх нь илүү найдвартай (296-р мөрний "itours-ийн"-ийг мөн үз). | Төлбөр орж, itours дээр хадгалагдаж байна. {op} {h} цагийн дотор баталгаажуулж, хөтчөө танилцуулна. Захиалга {code}. | Low |
| fe/mn.ts:486 | partner.seatsFill | {s} seats sold · {f}% fill rate | {s} суудал · {f}% дүүргэлт | "Sold" гэдэг үг орхигдсон. | {s} суудал зарагдсан · {f}% дүүргэлт | Low |
| fe/mn.ts:550 | orders.cancel | Cancel order (full refund to traveller) | Захиалга цуцлах (бүрэн буцаалт) | Хэнд буцаах нь орхигдсон. | Захиалга цуцлах (аялагчид бүрэн буцаан олгоно) | Low |
| fe/mn.ts:599 | editor.driveQ | drive time? | зам? | "Зам?" дангаараа утгагүй. | замын цаг? | Low |
| fe/mn.ts:604 | editor.claimsLead | Write at least 3 of each… honest cons raise your score, they never lower it. Rewording a line resets its ratings. | Тус бүр дор хаяж 3-ыг бич… оноог тань өсгөдөг. Мөрийг засвал үнэлгээ нь шинээр эхэлнэ. | "Бич" нь ширүүн тушаах хэлбэр (бусад заавар "-на уу" хэлбэртэй). "They never lower it" орхигдсон. | Тус бүр дор хаяж 3-ыг бичнэ үү. Аялагчид аяллын дараа мөр бүрийг үнэлнэ; шударга сул тал оноог тань өсгөдөг, хэзээ ч бууруулдаггүй. Мөрийг засвал үнэлгээ нь тэглэгдэнэ. | Low |
| fe/mn.ts:656 | profile.languages | Languages, comma separated | Хэлнүүд, таслалаар | "Хэл" үгийн олон тоо нь "хэлүүд" (695-р мөрөнд зөв бичсэн). | Хэлүүд, таслалаар | Low |
| fe/mn.ts:663 | admin.brand | ops | ops | Англиар үлдсэн. partner.brand-ийг "түнш" гэж орчуулсан. | админ | Low |
| fe/mn.ts:673 | admin.stockPhotos | stock photos flagged | сток зураг | "Flagged" гэдэг үг орхигдсон. | сток зураг илэрсэн | Low |
| be/mn.ts:31 | error.tokenInvalid | Session expired, please sign in again | Хугацаа дууссан, дахин нэвтэрнэ үү | Юуны хугацаа дууссан нь тодорхойгүй. | Нэвтрэлтийн хугацаа дууссан, дахин нэвтэрнэ үү | Low |
| be/mn.ts:42 | error.passwordTooShort | Password must be at least 6 characters | Нууц үг дор хаяж 6 тэмдэгт байна | "Must" гэсэн шаардлага "байна" (мэдэгдэл) болжээ. | Нууц үг дор хаяж 6 тэмдэгт байх ёстой | Low |
| be/mn.ts:60, 64 | error.reviewNotYet, error.orderNotPending | You can review after… / Only pending orders can be changed | …үнэлгээ өгнө / …захиалгыг өөрчилнө | "Can" гэсэн боломжийн утга ирээдүй цагийн "өгнө/өөрчилнө" болжээ. | Аялал дууссаны дараа үнэлгээ өгөх боломжтой / Зөвхөн хүлээгдэж буй захиалгыг өөрчлөх боломжтой | Low |
| be/mn.ts:61 | error.starsInvalid | Stars must be between 1 and 5 | Од 1-ээс 5 хооронд байна | "5-ын" гэсэн харьяалахын нөхцөл дутуу, мөн "must" орхигдсон. | Од 1-ээс 5-ын хооронд байх ёстой | Low |
| seed:404 | summaryMn (naadam-in-kharkhorin-4-days) | …and the horse race from the finish line. | …морь уралдааныг барианаас нь. | Тодотгол хэлбэр нь "морин уралдаан". | …бөх, сур харваа, морин уралдааныг барианаас нь. | Low |
| seed:498 | summaryMn (gobi-in-6) | …and get one night at the dunes. | …элсэнд нэг хоно. | Тушаах хэлбэр болжээ (бусад тайлбар "хононо" хэлбэртэй). | …12 хүртэлх хүнтэй нэг микроавтобусаар явж, элсэнд нэг хононо. | Low |

## Terminology glossary

Use one term per concept. The "Avoid" column lists the variants found in the code today.

| Concept (en) | Recommended mn | Avoid / found today |
|---|---|---|
| Expectation Score | Хүлээлтийн оноо (богино: оноо) | This term is already used consistently. |
| Trip plan (the listing) | төлөвлөгөө / аяллын төлөвлөгөө | аялал (be/mn.ts:19, 50, 52), шинэ төлөвлөгөө ✓ |
| Trip (the travel itself, a booking) | аялал | — |
| Operator / agency | компани / аяллын компани | байгууллага (admin and back-end) |
| Departure | гаралт; its date is "гарах огноо" | — (used consistently) |
| Cons (mandatory) | сул тал | — |
| Pros | давуу тал | — |
| Promise / claim | амлалт | — |
| Review (text) | сэтгэгдэл | — |
| Rating (per promise, stars) | үнэлгээ | — |
| Escrow | эскроу данс; the verb is "itours хадгална" | Эскроуд (orders.escrowHeld: write "Эскроу дансанд") |
| Seat hold (24 h, bank transfer) | суудал түр барих; noun phrase "түр барих хугацаа" | хадгалах, хадгалуулах, түр хадгалах, хадгалалт, барина (mixed) |
| Save (favourite plan) / Save button | хадгалах | Do not reuse it for the seat hold. |
| Bank transfer | шилжүүлэг | — |
| Payment reference | гүйлгээний утга | — |
| Refund | буцаан олгох (noun: буцаалт) | — |
| Free cancellation | үнэгүй цуцлах (боломжтой) | үнэгүй цуцална |
| Booking confirmed (by operator) | баталгаажсан | баталгаат (partner.confirmedBookings, plan.travelled) |
| Verified (operator, booking) | баталгаажсан | — |
| Verify / unverify licence | баталгаажуулах / баталгаажуулалт цуцлах | Цуцлах (alone) |
| Approve (plan review) | батлах | зөвшөөрөх |
| Licence | тусгай зөвшөөрөл | — |
| Upload | байршуулах | хуулах (which means Copy) |
| Copy / paste | хуулах / буулгах | — |
| Drive time | замын хугацаа; "{h} цаг зам" | жолоодлого, шилжилт |
| Sleeping / lodging | хонох байр | Хонох (as a bare label) |
| Tourist ger camp | жуулчны бааз | кемп (seed:600) |
| Single room / supplement | ганц хүний өрөө / ганц хүний өрөөний нэмэгдэл | ганц өрөө |
| Area (Gobi, North, …) | бүс | чиглэл (editor.area) |
| Province | аймаг | бүс (editor.region) |
| Summary | тойм | товчлол (which means abbreviation) |
| Golden Eagle Festival | Алтан бүргэдийн баяр | Бүргэдийн баяр, Алтан бүргэдийн наадам |
| Partner dashboard | түншийн самбар | түнш самбар |
| Dismiss a dialog / Cancel a booking | Болих / цуцлах | — (used correctly) |
| Done (button) | Дуусгах | Болсон |

## Button and label conventions

- Buttons use the verbal noun in -х: Хадгалах, Цуцлах, Захиалах, Засах, Нэмэх, Батлах. These four break the pattern and are flagged above:
  - `common.done` ("Болсон")
  - `orders.transferReceived` ("Шилжүүлэг орсон")
  - `admin.unverify` (ambiguous "Цуцлах")
  - `editor.saveDraft` (drops "draft")
- Instructions use the polite forms "-на уу" or "-аарай". Two strings use bare imperatives instead and are flagged above: `editor.claimsLead` ("бич") and `seed:498` ("хоно").
- The home-page slogans use bare imperatives: нээ (97), харьцуул (110), төл (112), оч (114), аял (137), захиал (171). That register is acceptable for marketing slogans, so it is not counted as a finding. Keep it to slogans only.

## Notes (not counted)

- **Inline Mongolian in the listed files:**
  - `checkout-view.tsx:171` is only a code comment.
  - `planners.tsx:78` (`{month}-р сар`) is correct.
  - `region-explorer.tsx:56` ("Улаанбаатар") is correct.
  - `language-toggle.tsx:9` ("МН") is correct.
  - `plan-page-view.tsx` has no inline Mongolian. Its titles and summaries come from the database through `pick()`.
  - `back-end/src/utils/index.ts:38–51` is a transliteration table for slugs (MNS 5217), not UI text.
- **Altai plan:** `titleMn` and `summaryMn` are empty on purpose (`seed:686, 698`). They demonstrate the "Mongolian title" checklist item in the review queue.
- **Seed reviews:** the Mongolian reviews (`seed:330, 384, 478`) read naturally and need no change.
- **Hard-coded English placeholders:**
  - `plan-editor.tsx:359, 384, 387, 556`
  - `orders-view.tsx:414, 418`
  - `operator-form-dialog.tsx:147, 150`

  They match the English-only content fields today. If Mongolian fields are added (the High seed row), these placeholders will need translating too.
