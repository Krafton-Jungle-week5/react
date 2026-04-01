# react2

브라우저 DOM을 Virtual DOM으로 정규화하고, 이전 트리와 다음 트리를 비교한 뒤 필요한 DOM 연산만 commit 하는 작은 JavaScript 라이브러리입니다.

이 저장소는 데모 페이지를 제외한 재사용용 코어만 담고 있습니다.

## 포함된 모듈

- `vdom`: DOM <-> Virtual DOM 변환, 렌더링, 직렬화
- `fiber`: reconciliation, effect queue 생성, commit 실행

## 설치

```bash
npm install
```

## 스크립트

```bash
npm run build
npm run test
```

## 사용 예시

```js
import {
  mountVNode,
  parseHtmlToVNode,
  reconcileTrees,
  commitRoot,
} from 'react2-vdom';

const container = document.querySelector('#app');

const previousTree = parseHtmlToVNode(`
  <div class="before">
    <p>old text</p>
  </div>
`);

const nextTree = parseHtmlToVNode(`
  <div class="after" data-state="ready">
    <p>new text</p>
    <span>added</span>
  </div>
`);

mountVNode(container, previousTree);

const work = reconcileTrees(previousTree, nextTree);
commitRoot(container, work.rootFiber);
```

## 공개 엔트리

- `react2-vdom`
- `react2-vdom/vdom`
- `react2-vdom/fiber`
