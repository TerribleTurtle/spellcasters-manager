import { Spell } from "@/types";
import { GenericEntityEditor } from "./GenericEntityEditor";
import { SPELL_EDITOR_CONFIG, EditorProps } from "./editorConfig";

export interface SpellEditorProps extends EditorProps {
  initialData?: Spell;
}

export function SpellEditor(props: SpellEditorProps) {
  return <GenericEntityEditor<Spell> {...props} config={SPELL_EDITOR_CONFIG} />;
}
