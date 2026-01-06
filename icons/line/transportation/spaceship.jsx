export function Spaceship({ ...rest }) {
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
        d="M15 18C15 18 17.473 11.9056 16 8.25C15.0892 5.98959 12 2 12 2C12 2 8.91081 5.98959 7.99998 8.25C6.52698 11.9056 8.99998 18 8.99998 18M15 18H8.99998M15 18H20L16.5 12M8.99998 18H4L7.5 12M8 8C8 8 9.5 9 12 9C14.5 9 16 8 16 8M10.6795 18C10.6795 18 10.283 18.939 10.0213 19.7857C9.75963 20.6324 12 22.5 12 22.5C12 22.5 14.285 20.6109 13.9703 19.7857C13.6556 18.9605 13.3122 18 13.3122 18H10.6795Z"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default Spaceship;
