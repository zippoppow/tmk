export function Bike({ ...rest }) {
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
        d="M19 15C19 15 19.3961 12.8768 19.5 11.5C19.6176 9.94233 19.5967 9.0591 19.5 7.5C19.4026 5.92876 20 2.5 20 2.5L14.5 3.5M9 4H4M6.5 4.5L5 15C5 15 8 11 11.5 9C15 7 19.5 7 19.5 7M23 15C23 17.2091 21.2091 19 19 19C16.7909 19 15 17.2091 15 15C15 12.7909 16.7909 11 19 11C21.2091 11 23 12.7909 23 15ZM9 15C9 17.2091 7.20914 19 5 19C2.79086 19 1 17.2091 1 15C1 12.7909 2.79086 11 5 11C7.20914 11 9 12.7909 9 15Z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default Bike;
