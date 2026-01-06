export function Compass({ ...rest }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <path
        d="M23 12C23 18.0751 18.0751 23 12 23C5.92487 23 1 18.0751 1 12C1 5.92487 5.92487 1 12 1C18.0751 1 23 5.92487 23 12Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        d="M9.82843 9.82843L15.9497 7.70711L13.8284 13.8284L7.70711 15.9497L9.82843 9.82843Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default Compass;
