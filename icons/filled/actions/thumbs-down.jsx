export function ThumbsDown({ ...rest }) {
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
        d="M3 11C1.34315 11 0 12.3431 0 14V20C0 21.6569 1.34315 23 3 23H4V11H3Z"
        fill="currentColor"
      />
      <path
        d="M6 9.82232V23H16.7371C18.0765 23 19.2537 22.1121 19.6217 20.8242L21.9074 12.8242C22.4549 10.9077 21.0159 9 19.0228 9H14.6235C13.7259 9 13.0293 8.21693 13.1337 7.32541L13.5041 4.16543C13.7015 2.48022 12.3847 1 10.6879 1C10.1192 1 9.60558 1.33981 9.38315 1.86318L6.01753 9.78228C6.01182 9.79571 6.00598 9.80906 6 9.82232Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default ThumbsDown;
