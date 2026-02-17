import { Hero } from "@/types";
import { GenericEntityEditor } from "./GenericEntityEditor";
import { HERO_EDITOR_CONFIG, EditorProps } from "./editorConfig";

export interface HeroEditorProps extends EditorProps {
  initialData?: Hero;
}

export function HeroEditor(props: HeroEditorProps) {
  return <GenericEntityEditor<Hero> {...props} config={HERO_EDITOR_CONFIG} />;
}
