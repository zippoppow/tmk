export function Wind({ ...rest }) {
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
        d="M10.8 11H13.2L14 22H10L10.8 11Z"
        stroke="currentColor"
        strokeWidth="2"
      />
      <ellipse
        cx="12"
        cy="6"
        rx="2"
        ry="5"
        stroke="currentColor"
        strokeWidth="2"
      />
      <ellipse
        rx="2"
        ry="5"
        transform="matrix(-0.632493 0.774566 0.774566 0.632493 18.1379 15.7116)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <ellipse
        cx="6.13776"
        cy="15.7116"
        rx="2"
        ry="5"
        transform="rotate(50.7657 6.13776 15.7116)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <circle cx="12" cy="12" r="2" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

export default Wind;
