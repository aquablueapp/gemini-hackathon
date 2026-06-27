import { Node } from 'web-tree-sitter';

export interface CodeEntity {
  name: string;
  type: string;
  startLine: number;
  endLine: number;
  content: string;
}

export function parseCodeEntities(node: Node): CodeEntity[] {
  const entities: CodeEntity[] = [];
  const targetTypes = [
    'function_definition', 'class_definition', // Python
    'function_declaration', 'class_declaration', 'interface_declaration', 'method_definition', // TS
    'function_item', 'struct_item', 'impl_item' // Rust
  ];

  if (targetTypes.includes(node.type)) {
    let name = 'anonymous';
    const nameNode = node.childForFieldName('name') || node.child(1);
    if (nameNode) name = nameNode.text;

    entities.push({
      name,
      type: node.type,
      startLine: node.startPosition.row + 1,
      endLine: node.endPosition.row + 1,
      content: node.text
    });
  }

  for (let i = 0; i < node.childCount; i++) {
    entities.push(...parseCodeEntities(node.child(i)!));
  }
  return entities;
}

export function deduplicateNestedEntities(entities: CodeEntity[], modifiedLines: number[]): CodeEntity[] {
  const matched = entities.filter(e => 
    modifiedLines.some(line => line >= e.startLine && line <= e.endLine)
  );

  return matched.map(entity => {
    if (entity.type.includes('class')) {
      const children = matched.filter(child => 
        child !== entity && child.startLine >= entity.startLine && child.endLine <= entity.endLine
      );
      if (children.length > 0) {
        const header = entity.content.split('\n')[0] + '\n  // ... [Nested methods audited separately] ...';
        return { ...entity, content: header };
      }
    }
    return entity;
  });
}
