import { Icon } from "@/components/ui/icons";
import { signOut } from "./actions";

export default function SignOut() {
  return (
    <form action={signOut}>
      <button type="submit" className="btn btn-ghost">
        <Icon name="logout" className="h-4 w-4" />
        Sign out
      </button>
    </form>
  );
}
