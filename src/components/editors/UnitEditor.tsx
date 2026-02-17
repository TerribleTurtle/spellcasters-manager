import { Unit } from "@/types";
import { GenericEntityEditor } from "./GenericEntityEditor";
import { UNIT_EDITOR_CONFIG, EditorProps } from "./editorConfig";

export interface UnitEditorProps extends EditorProps {
  initialData?: Unit;
}

export function UnitEditor(props: UnitEditorProps) {
  return <GenericEntityEditor<Unit> {...props} config={UNIT_EDITOR_CONFIG} />;
}
