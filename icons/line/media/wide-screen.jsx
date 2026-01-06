export function WideScreen({ ...rest }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <rect
        x="1"
        y="6"
        width="22"
        height="12"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default WideScreen;
