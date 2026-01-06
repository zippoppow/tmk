export function Venmo({ ...rest }) {
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
        d="M4 0C1.79086 0 0 1.79086 0 4V20C0 22.2091 1.79086 24 4 24H20C22.2091 24 24 22.2091 24 20V4C24 1.79086 22.2091 0 20 0H4ZM18 8.39973C18 7.46242 17.8078 6.7204 17.3813 6L13.6933 6.76363C13.9277 7.26588 14.0777 7.87587 14.0777 8.77141C14.0777 10.4075 12.9469 12.8072 12.0305 14.3343L11.0498 6.26126L7 6.65455L8.85494 18H13.4801C15.505 15.2729 18 11.3893 18 8.39973Z"
        fill="currentColor"
      />
    </svg>
  );
}

export default Venmo;
