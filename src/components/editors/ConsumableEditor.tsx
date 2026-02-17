import { Consumable } from "@/types";
import { GenericEntityEditor } from "./GenericEntityEditor";
import { CONSUMABLE_EDITOR_CONFIG, EditorProps } from "./editorConfig";

export interface ConsumableEditorProps extends EditorProps {
  initialData?: Consumable;
}

export function ConsumableEditor(props: ConsumableEditorProps) {
  return <GenericEntityEditor<Consumable> {...props} config={CONSUMABLE_EDITOR_CONFIG} />;
}
