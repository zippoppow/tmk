export function GeoLocate({ ...rest }) {
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
        d="M23 12C23 18.0751 18.0751 23 12 23M23 12C23 5.92487 18.0751 1 12 1M23 12H18M12 23C5.92487 23 1 18.0751 1 12M12 23V18M1 12C1 5.92487 5.92487 1 12 1M1 12H6M12 1V6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default GeoLocate;
