export function Card({ ...rest }) {
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
        d="M1 10H23M1 7C1 5.34315 2.34315 4 4 4H20C21.6569 4 23 5.34315 23 7V18C23 19.6569 21.6569 21 20 21H4C2.34315 21 1 19.6569 1 18V7Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default Card;
