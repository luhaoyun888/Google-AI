
import { WasmPlugin, SecurityPolicy, LogEntry } from '../types';
import { createRuntimeInstance } from './runtime/engine';

// This is now a facade for the modular runtime engine
export async function* runPluginSimulation(
  plugin: WasmPlugin, 
  policy: SecurityPolicy,
  onWrite?: (path: string, content: string) => void
): AsyncGenerator<LogEntry> {
  const runtime = createRuntimeInstance(plugin, policy, onWrite);
  for await (const log of runtime) {
    yield log;
  }
}

// Re-export utility if needed by other components, though mostly internal now
export { matchPattern } from './runtime/sandbox';