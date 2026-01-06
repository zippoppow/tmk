export function Repeat({ ...rest }) {
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
        d="M5 5H17C20.3137 5 23 7.68629 23 11V12M5 5L9 1M5 5L9 9M19 19L7 19C3.68629 19 1 16.3137 1 13L1 12M19 19L15 23M19 19L15 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Repeat;
