import { dirname } from "node:path";
import { mkdir, rm } from "node:fs/promises";
import { atomicWriteTextFile } from "../../utils/atomicFileWrite";
import type { AdventureModuleIndex } from "@mighty-decks/spec/adventureModule";
import type { ModuleSystemMetadata } from "./shared";
import { writeModuleIndex, writeModuleSystem } from "./core";

export const rollbackCreate = async (
  moduleDir: string,
  previousIndex: AdventureModuleIndex,
  previousSystem: ModuleSystemMetadata,
  fragmentPath: string,
): Promise<void> => {
  await Promise.allSettled([
    writeModuleIndex(moduleDir, previousIndex),
    writeModuleSystem(moduleDir, previousSystem),
    rm(fragmentPath, { recursive: true, force: true }),
  ]);
};

export const rollbackUpdate = async (
  moduleDir: string,
  previousIndex: AdventureModuleIndex,
  previousSystem: ModuleSystemMetadata,
  previousFragmentPath: string,
  nextFragmentPath: string,
  previousContent: string,
): Promise<void> => {
  const rollbackTasks: Array<Promise<unknown>> = [
    writeModuleIndex(moduleDir, previousIndex),
    writeModuleSystem(moduleDir, previousSystem),
  ];

  if (previousFragmentPath === nextFragmentPath) {
    rollbackTasks.push(atomicWriteTextFile(previousFragmentPath, previousContent));
  } else {
    rollbackTasks.push(
      mkdir(dirname(previousFragmentPath), { recursive: true }).then(() =>
        atomicWriteTextFile(previousFragmentPath, previousContent),
      ),
    );
    rollbackTasks.push(rm(nextFragmentPath, { recursive: true, force: true }));
  }

  await Promise.allSettled(rollbackTasks);
};

export const rollbackDelete = async (
  moduleDir: string,
  previousIndex: AdventureModuleIndex,
  previousSystem: ModuleSystemMetadata,
  fragmentPath: string,
  previousContent: string,
): Promise<void> => {
  await Promise.allSettled([
    writeModuleIndex(moduleDir, previousIndex),
    writeModuleSystem(moduleDir, previousSystem),
    mkdir(dirname(fragmentPath), { recursive: true }).then(() =>
      atomicWriteTextFile(fragmentPath, previousContent),
    ),
  ]);
};
