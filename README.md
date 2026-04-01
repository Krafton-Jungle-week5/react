# react2

`react2`는 React의 핵심 개념인 Component, State, Hooks, Virtual DOM + Diff + Patch를 직접 구현해 보는 실습 프로젝트입니다.  
함수형 컴포넌트만 지원하며, 상태는 루트 `FunctionComponent`에만 저장됩니다.

## 구현 목표

- 함수형 컴포넌트 기반 UI 분리
- 루트 컴포넌트에서만 상태 관리
- `useState`, `useMemo`, `useEffect` 직접 구현
- Virtual DOM 생성 후 이전 트리와 비교(diff)
- 바뀐 부분만 실제 DOM에 반영(patch)
- 브라우저에서 동작하는 인터랙티브 데모 제공

## 포함된 모듈

- `src/lib/vdom.js`
  - Virtual DOM 생성, diff, patch, 직렬화
- `src/lib/runtime.js`
  - `FunctionComponent`, `h`, `useState`, `useMemo`, `useEffect`
  - root hooks 저장소와 microtask 기반 batching
  - hooks 시각화 / 렌더링 흐름 추적용 inspector snapshot 제공
- `src/demo`
  - 메인 Tic-Tac-Toe 데모와 runtime inspector
- `src/nonfiber-demo`
  - non-fiber 엔트리 데모
- `src/tic-tac-toe/model.js`
  - 게임 상태 전이와 승패 계산 로직

## 설치

```bash
npm install
```

## 실행 명령어

```bash
npm run dev
npm run build
npm run test
```

## 데모 페이지

개발 서버 실행:

```bash
npm run dev
```

접속 경로:

- `/`
  - 메인 Tic-Tac-Toe 데모
- `/nonfiber.html`
  - non-fiber Tic-Tac-Toe 데모

두 페이지 모두 아래 기능을 함께 제공합니다.

- Hooks 동작 시각화 패널
  - 루트 `hooks[]` 배열의 슬롯 번호, hook 종류, 현재 값 표시
- 렌더링 흐름 추적 패널
  - `setState -> scheduleUpdate -> update -> renderAndCommit -> diff -> patch -> effect` 순서 로그 표시

## 런타임 설계 요약

- 모든 hooks는 루트 `FunctionComponent`의 `hooks[]` 배열에 저장됩니다.
- 자식 컴포넌트는 props만 받는 순수 함수형 컴포넌트입니다.
- `setState`는 즉시 DOM을 바꾸지 않고 queue에 updater를 쌓습니다.
- 여러 상태 변경은 microtask 하나로 모아서 처리됩니다.
- `useMemo`는 dependency가 바뀔 때만 값을 다시 계산합니다.
- `useEffect`는 DOM patch 이후 실행되고, 다시 실행되기 전에 이전 cleanup을 호출합니다.
- DOM 갱신은 `patchDom(previousTree, nextTree)`를 통해 필요한 부분만 반영합니다.

## 시연 포인트

면접이나 발표에서 설명하기 좋은 포인트는 아래와 같습니다.

- `hooks[]` 배열이 실제로 어떤 슬롯 구조를 갖는지 화면에서 바로 확인할 수 있습니다.
- 한 번의 클릭이 런타임 내부에서 어떤 단계로 이어지는지 로그로 확인할 수 있습니다.
- 메인 데모와 non-fiber 데모가 같은 루트 hooks 런타임을 공유합니다.
- 게임 로직은 `model.js`로 분리되어 있어 UI와 상태 전이를 따로 설명할 수 있습니다.

## 테스트

현재 테스트는 다음 범위를 확인합니다.

- 루트 상태 저장과 DOM 반영
- batching 동작
- `useMemo` 재계산 조건
- `useEffect` 실행 및 cleanup 순서
- 자식 컴포넌트에서 hooks 사용 금지
- inspector snapshot에 hooks 슬롯 / 렌더링 흐름이 포함되는지 검증
- Tic-Tac-Toe 상태 전이와 승패 계산 검증
- Virtual DOM diff / patch 검증
