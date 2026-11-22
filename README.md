# finance-motion-references

Finance Motion Studio에서 쓰는 **레퍼런스 카드** 저장소입니다.
시안을 코드로 하나씩 만들지 않고, *데이터 모양*으로 자동 판정되는 카드 목록을 스튜디오가 받아 씁니다.

## 원칙

- **회사 데이터·내부 수치·브랜드 자산을 넣지 않습니다.** 공개 예제와 값이 빈 템플릿만 둡니다.
- 템플릿의 값 자리는 `"$DATA"`로 비워 둡니다. 실제 숫자는 스튜디오가 원본 자료(근거 ID)에서 채웁니다.
- 라이선스 허용 목록(`sources.yaml`)에 없는 카드는 병합되지 않습니다.

## 구조

```
sources.yaml                 상류 저장소 목록·라이선스 허용 목록
catalog/schema.card.json     카드 스키마
catalog/cards/<id>.json      카드 1개 = 레퍼런스 1개 (kind: chart | layout)
catalog/index.json           빌드 산출물 (커밋하지 않아도 됨)
templates/echarts/<id>.json  차트 템플릿 (ECharts 옵션, $DATA 바인딩)
templates/layouts/<id>.json  장표 배치 템플릿 (1600×900 슬롯)
samples/<id>.json            미리보기용 가상 값 (회사 데이터 아님)
guidelines/                  차트·장표 작성 규칙 (공공기관 가이드 요약) + 기계 검사 규칙
previews/<id>.png            미리보기
vendor/                      echarts.min.js + LICENSE
scripts/                     validate · build-index · bind(바인더 참조 구현) · render-preview
```

## 카드 선택 흐름 (스튜디오)

1. 장표의 관계 유형 분류 (FT Visual Vocabulary 9유형)
2. `dataShape`·`constraints`로 자동 필터 (범주 수, 지표 수, 라벨 길이, 음수)
3. 대상 프로필(`report`·`public`·`external`) 적합도
4. 남은 후보 중 LLM이 3안 선정

## 사용

```bash
node scripts/validate.mjs      # 카드 검증
node scripts/build-index.mjs   # catalog/index.json 생성
```

배포: `references-YYYY.MM` 태그를 올리면 Actions가 검증 후 zip + sha256을 릴리스에 올립니다.
스튜디오의 "레퍼런스 업데이트"가 이 릴리스를 받아 설치합니다.

## 자료 출처 원칙

| 구분 | 예 | 저장소에 넣는 것 |
|---|---|---|
| 오픈소스 예제 | Apache ECharts 예제 (Apache-2.0) | 재작성한 템플릿 + 원 예제 링크·커밋 |
| 공공기관 가이드 | ONS (OGL v3.0), 미 연준(퍼블릭 도메인), 세계은행(CC BY 4.0) | 원칙을 우리 말로 요약 + 링크 |
| 기업·은행 IR 자료 | DBS, HSBC, Airbnb, Booking, Expedia, Trip.com | **구성 방식만** 관찰해 새로 그린 배치 + 링크. 원본 파일·이미지·문구·수치·로고 없음 |

## 현재 카드 (50개)

### 장표 배치 (layout, 16개)

| id | 이름 | 장표 유형 | 참고 |
|---|---|---|---|
| bridge-table-commentary | 증감 브리지 + 항목 표 + 해설 | 비교·현황 | DBS Group, HSBC Holdings |
| comparison-table | 당기·전기 비교표 + 증감 | 표·비교 | Expedia Group, HSBC Holdings |
| dual-bridge | 브리지 2개 나란히(예: 차입금·예금 증감) | 비교 | HSBC Holdings |
| kpi-tiles-grouped | KPI 타일 묶음(재무·영업 지표) | 요약 | Airbnb, HSBC Holdings |
| kpi-vs-guidance | KPI + 가이던스 범위 표시 | 요약·비교 | Booking Holdings |
| multi-panel-drivers | 요인 패널(2×2) | 추이·비교 | HSBC Holdings |
| paired-charts-shared-periods | 같은 기간 축을 공유하는 차트 2개 | 추이·비교 | DBS Group |
| rollforward-table | 잔액 증감표(기초→기말) | 표·추이 | DBS Group, HSBC Holdings |
| section-divider | 구간 표지 | 표지 | HSBC Holdings, DBS Group |
| segment-matrix | 부문별 매트릭스 | 표·비교 | HSBC Holdings, Trip.com Group |
| statement-chart-caption | 결론 문장 + 차트 + 캡션 | 추이·현황 | Airbnb |
| status-tracker | 과제 진행 현황판 | 프로세스·표 | HSBC Holdings |
| targets-guidance-table | 목표·가이던스 표 | 요약·표 | HSBC Holdings, Booking Holdings |
| three-theme-columns | 3개 주제 기둥 | 요약·프로세스 | HSBC Holdings |
| trend-with-delta-row | 기간 추이 + 증감 행 | 추이 | DBS Group, HSBC Holdings |
| trend-with-guidance | 추이 + 가이던스(목표 범위) 상자 | 추이·비교 | HSBC Holdings, Booking Holdings |

### 차트 (chart, 34개)

| id | 이름 | 관계 | PPT 변환 |
|---|---|---|---|
| bar-race | 순위 경쟁 막대(애니메이션) | ranking | image |
| bar-vs-limit | 한도 대비 사용(배경 막대) | magnitude | approx |
| boxplot-distribution | 박스플롯(분포 비교) | distribution | image |
| bump-rank | 순위 변화(범프) | ranking | approx |
| calendar-heatmap | 달력 히트맵(일별 금액) | change-over-time | image |
| candlestick-fx | 캔들(환율·가격 OHLC) | change-over-time | image |
| cash-flow-sankey | 자금 원천·사용(생키) | flow | image |
| combo-bar-line | 금액 막대 + 비율 선(이중 축) | change-over-time | native |
| composition-stacked-bar | 기간별 구성(누적 막대) | part-to-whole | native |
| daily-balance-area | 일별 잔액(시간축 영역) | change-over-time | native |
| diverging-bar | 양·음 차이 막대(차이 분석) | deviation | native |
| exposure-donut | 노출 비중(도넛) | part-to-whole | native |
| forecast-band | 전망 + 범위 밴드 | change-over-time | approx |
| funnel-process | 퍼널(처리 단계별 건수) | flow | approx |
| gauge-progress | 진행 게이지(한도 소진율) | magnitude | approx |
| grouped-bar | 묶음 막대(기간 비교) | magnitude | native |
| half-donut-kpi | 반원 도넛(비중 KPI) | part-to-whole | approx |
| hbar-stacked | 가로 누적 막대(항목별 구성) | part-to-whole | native |
| heatmap-matrix | 히트맵(만기×통화 등 2차원) | distribution | image |
| line-highlight-period | 추이 + 구간 강조 | change-over-time | approx |
| line-race | 선 경쟁(시간 진행 애니메이션) | change-over-time | image |
| line-reference-lines | 추이 + 기준선(평균·한도) | change-over-time | native |
| maturity-ladder | 차입금 만기 사다리 | magnitude | native |
| nested-donut | 2단 도넛(대분류·소분류) | part-to-whole | approx |
| ranking-hbar | 항목 순위(가로 막대, 긴 라벨 허용) | ranking | native |
| scatter-correlation | 산점도(두 지표 관계) | correlation | native |
| stacked-100-bar | 구성비 100% 누적 막대 | part-to-whole | native |
| stacked-area | 누적 영역(구성 추이) | change-over-time | native |
| step-line-rate | 계단선(금리·환율 고시 변화) | change-over-time | approx |
| sunburst | 선버스트(다단 구성) | part-to-whole | image |
| treemap-balance | 트리맵(잔액 규모·위계) | part-to-whole | image |
| trend-line-target | 추이 + 목표선 | change-over-time | native |
| waterfall-bridge | 증감 브리지(워터폴) | deviation | approx |
| waterfall-increase-decrease | 증가·감소 구분 워터폴 | deviation | approx |

미리보기: `previews/<id>.svg` (`node scripts/render-preview.mjs`로 재생성)
