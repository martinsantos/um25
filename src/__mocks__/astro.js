// Mock para componentes Astro
const AstroMock = {
  request: {
    url: new URL('http://localhost:3000/antecedentes'),
    canonicalURL: new URL('http://localhost:3000/antecedentes'),
    params: {},
  },
  params: {},
  props: {},
  redirect: vi.fn(),
  response: {
    headers: new Headers(),
  },
  site: new URL('http://localhost:3000'),
  slug: 'antecedentes',
  url: new URL('http://localhost:3000/antecedentes'),
};

// Mock global para Astro
globalThis.Astro = AstroMock;

// Mock para componentes Astro
export default function AstroComponent(props) {
  return {
    ...AstroMock,
    ...props,
    $$render: () => '<div>Mocked Astro Component</div>',
  };
}

// Mock para getStaticPaths
export function getStaticPaths() {
  return [];
}

// Mock para getStaticProps
export function getStaticProps() {
  return {};
}

// Mock para getServerSideProps
export function getServerSideProps() {
  return {};
}
