import { AppError } from "../shared/AppError.js";
import type { Command } from "../core/Command.js";
import { DocumentCommand } from "./DocumentCommand.js";
import { GroupShape } from "../model/GroupShape.js";
import { Shape } from "../model/Shape.js";
import { SvgDocument } from "../model/SvgDocument.js";

interface ShapeLocation {
  shape: Shape;
  parent: GroupShape | null;
  index: number;
}

export class GroupCommand extends DocumentCommand implements Command {
  private group: GroupShape | null = null;
  private locations: ShapeLocation[] = [];
  private orderedTargets: Shape[] = [];
  private groupParent: GroupShape | null = null;
  private groupIndex = 0;

  public constructor(document: SvgDocument, private readonly groupId: string, private readonly targetIds: string[]) {
    super(document);
    if (targetIds.length === 0) {
      throw new AppError("group requires at least one shape");
    }
  }

  public execute(): string {
    if (this.group === null) {
      this.prepareFirstExecution();
    }
    const group = this.group;
    if (group === null) {
      throw new Error("group command has no group");
    }

    this.detachTargets();
    this.document.attachShape(group, this.groupParent, this.groupIndex);
    for (const target of this.orderedTargets) {
      group.addChild(target);
    }
    return `${group.getDisplayName()} created with ${this.orderedTargets.length} children`;
  }

  public undo(): string {
    if (this.group === null) {
      throw new Error("group command has no group");
    }

    this.document.detachShape(this.group);
    for (const target of this.orderedTargets) {
      this.group.removeChild(target);
    }
    for (const location of [...this.locations].sort((left, right) => {
      if (left.parent === right.parent) {
        return left.index - right.index;
      }
      return this.locations.indexOf(left) - this.locations.indexOf(right);
    })) {
      this.document.attachShape(location.shape, location.parent, location.index);
    }
    return `${this.group.getDisplayName()} removed, ${this.orderedTargets.length} children restored`;
  }

  private prepareFirstExecution(): void {
    if (this.document.findById(this.groupId) !== null) {
      throw new AppError(`id already exists: ${this.groupId}`);
    }

    const targets = this.targetIds.map((id) => this.shapeById(id));
    if (new Set(targets).size !== targets.length) {
      throw new AppError("group targets must be unique");
    }

    for (const target of targets) {
      if (!(target instanceof GroupShape)) {
        continue;
      }
      for (const other of targets) {
        if (other !== target && this.document.isDescendantOf(other, target)) {
          throw new AppError(`cannot group a container into its own descendant: ${target.id}`);
        }
      }
    }

    this.locations = targets.map((shape) => {
      const parent = shape.getParent();
      const index = parent?.indexOf(shape) ?? this.document.getChildren().indexOf(shape);
      return { shape, parent, index };
    });
    this.groupParent = this.locations[0].parent;
    const sameParentLocations = this.locations.filter((location) => location.parent === this.groupParent);
    this.groupIndex = Math.min(...sameParentLocations.map((location) => location.index));
    this.orderedTargets = [...targets].sort((left, right) => {
      const leftLocation = this.locations.find((location) => location.shape === left);
      const rightLocation = this.locations.find((location) => location.shape === right);
      if (leftLocation?.parent === rightLocation?.parent) {
        return (leftLocation?.index ?? 0) - (rightLocation?.index ?? 0);
      }
      return this.targetIds.indexOf(left.id) - this.targetIds.indexOf(right.id);
    });
    this.group = new GroupShape(this.groupId);
  }

  private detachTargets(): void {
    for (const location of [...this.locations].sort((left, right) => {
      if (left.parent === right.parent) {
        return right.index - left.index;
      }
      return 0;
    })) {
      this.document.detachShape(location.shape);
    }
  }
}
