# Mario Kart — Frost Cup

크리스마스 밤, 눈 덮인 빙하 서킷에서 AI 라이벌 다섯 명과 경쟁하는 웹 카트 레이싱 게임입니다. 마리오, 루이지, 피치, 키노피오, 요시, 쿠파 중 하나를 골라 세 바퀴를 완주하세요.

[Vercel에서 플레이](https://mario-kart-frost-cup.vercel.app/)

| 동작 | 키 |
| --- | --- |
| 가속 / 제동 | ↑ / ↓ 또는 W / S |
| 방향 전환 | ← / → 또는 A / D |
| 드리프트 | 방향키 + Shift를 누른 뒤 떼기 |
| 아이템 사용 | Space |
| 시작 / 일시 정지 | Enter / Esc |
| 소리 켜기·끄기 | M |

휴대폰에서는 레이스 시작 후 화면에 조작 버튼이 나옵니다. 아이템 상자를 통과하면 부스트나 눈덩이를 얻습니다. 빙판 위의 하늘색 발판도 부스트를 줍니다.

HTML, CSS, JavaScript로 만든 정적 사이트입니다. 카트, 트랙, 설경은 Canvas로 그리고 배경 음악과 효과음은 Web Audio로 합성합니다. 게임 설정과 최고 기록은 현재 브라우저에 저장됩니다.

설치 없이 `dist/index.html`을 브라우저에서 열면 됩니다. 웹 서버를 사용하려면 `python3 -m http.server 8000 --directory dist`를 실행한 뒤 `http://localhost:8000`으로 접속하세요.

Vercel은 `dist` 폴더의 파일을 별도 빌드 없이 게시합니다. 연결된 Vercel 프로젝트에 직접 프로덕션 배포하려면 저장소 루트에서 `vercel deploy --prod`를 실행하세요.

비공식 팬 게임입니다.
