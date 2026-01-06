export function Search({ ...rest }) {
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
        fillRule="evenodd"
        clipRule="evenodd"
        d="M11 0C4.92487 0 0 4.92487 0 11C0 17.0751 4.92487 22 11 22C13.315 22 15.463 21.2849 17.235 20.0635L19.5858 22.4142C20.3668 23.1953 21.6332 23.1953 22.4142 22.4142C23.1953 21.6332 23.1953 20.3668 22.4142 19.5858L20.0635 17.235C21.2849 15.463 22 13.315 22 11C22 4.92487 17.0751 0 11 0ZM4 11C4 7.13401 7.13401 4 11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default Search;
