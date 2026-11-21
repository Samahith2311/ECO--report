import { signOut } from "./actions";

export default function SignOut() {
  return (
    <form action={signOut}>
      <button type="submit" className="btn btn-secondary !py-1.5">Sign out</button>
    </form>
  );
}
