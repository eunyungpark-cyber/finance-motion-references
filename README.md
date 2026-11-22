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
catalog/cards/<id>.json      카드 1개 = 레퍼런스 1개
catalog/index.json           빌드 산출물 (커밋하지 않아도 됨)
templates/echarts/<id>.json  ECharts 옵션 템플릿 ($DATA 바인딩)
previews/<id>.png            미리보기
vendor/                      echarts.min.js + LICENSE
scripts/                     validate · build-index
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

## 현재 카드

| id | 이름 | 관계 | PPT 변환 |
|---|---|---|---|
| waterfall-bridge | 증감 브리지(워터폴) | deviation | approx |
| maturity-ladder | 차입금 만기 사다리 | magnitude | native |
| trend-line-target | 추이 + 목표선 | change-over-time | native |
| composition-stacked-bar | 기간별 구성(누적 막대) | part-to-whole | native |
| exposure-donut | 노출 비중(도넛) | part-to-whole | native |
| ranking-hbar | 항목 순위(가로 막대, 긴 라벨 허용) | ranking | native |
