import { EntryScreen } from "@/components/EntryScreen";
import { GUIDE_STUBS } from "@/lib/guides";

export default function Page() {
  return <EntryScreen guides={GUIDE_STUBS} />;
}
