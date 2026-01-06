export function ThumbsUp({ ...rest }) {
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
        d="M3 13C1.34315 13 0 11.6569 0 10V4C0 2.34315 1.34315 1 3 1H4V13H3Z"
        fill="currentColor"
      />
      <path
        d="M6 14.1777V1H16.7371C18.0765 1 19.2537 1.88793 19.6217 3.17584L21.9074 11.1758C22.4549 13.0923 21.0159 15 19.0228 15H14.6235C13.7259 15 13.0293 15.7831 13.1337 16.6746L13.5041 19.8346C13.7015 21.5198 12.3847 23 10.6879 23C10.1192 23 9.60558 22.6602 9.38315 22.1368L6.01753 14.2177C6.01182 14.2043 6.00598 14.1909 6 14.1777Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default ThumbsUp;
