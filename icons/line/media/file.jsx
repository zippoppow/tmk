export function File({ ...rest }) {
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
        d="M21 20V13C21 10.7909 19.2091 9 17 9H14.9211C14.0926 9 13.4211 8.32843 13.4211 7.5V5C13.4211 2.79086 11.6302 1 9.42105 1H6M21 20C21 21.6569 19.6569 23 18 23H6C4.34315 23 3 21.6569 3 20V4C3 2.34315 4.34315 1 6 1M21 20V13.2847C21 11.1633 20.2507 9.11015 18.8842 7.48749L16.1181 4.20278C14.4081 2.1721 11.8887 1 9.23393 1H6"
        stroke="currentColor"
        strokeWidth="2"
      />
    </svg>
  );
}

export default File;
