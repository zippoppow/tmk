export function AutoLayout({ ...rest }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      {...rest}
    >
      <g clip-path="url(#clip0_2780_35733)">
        <path
          d="M2 5C2 3.89543 2.89543 3 4 3H20C21.1046 3 22 3.89543 22 5V7C22 8.10457 21.1046 9 20 9H4C2.89543 9 2 8.10457 2 7V5Z"
          stroke="currentColor"
          strokeWidth="2"
        />
        <path
          d="M2 17C2 15.8954 2.89543 15 4 15H20C21.1046 15 22 15.8954 22 17V19C22 20.1046 21.1046 21 20 21H4C2.89543 21 2 20.1046 2 19V17Z"
          stroke="currentColor"
          strokeWidth="2"
        />
      </g>
      <defs>
        <clipPath id="clip0_2780_35733">
          <rect width="24" height="24" fill="white" />
        </clipPath>
      </defs>
    </svg>
  );
}

export default AutoLayout;
