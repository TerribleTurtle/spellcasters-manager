import { UnitEditor } from "@/components/editors/UnitEditor";
import { HeroEditor } from "@/components/editors/HeroEditor";
import { ConsumableEditor } from "@/components/editors/ConsumableEditor";
import { SpellEditor } from "@/components/editors/SpellEditor";
import { EditorProps } from "@/components/editors/editorConfig";
import { EntityCategory } from "@/config/entityRegistry";

type AnyEditorComponent = React.ComponentType<EditorProps>;

export const EDITOR_MAP: Partial<Record<EntityCategory | string, React.ComponentType<EditorProps>>> = {
    'units': UnitEditor as AnyEditorComponent, 'unit': UnitEditor as AnyEditorComponent, 'structure': UnitEditor as AnyEditorComponent, 'titans': UnitEditor as AnyEditorComponent,
    'heroes': HeroEditor as AnyEditorComponent, 'hero': HeroEditor as AnyEditorComponent,
    'items': ConsumableEditor as AnyEditorComponent, 'consumables': ConsumableEditor as AnyEditorComponent, 'consumable': ConsumableEditor as AnyEditorComponent, 
    'spells': SpellEditor as AnyEditorComponent, 'spell': SpellEditor as AnyEditorComponent
};
