import { useRef } from 'react';
import { IRefPhaserGame, PhaserGame } from './game/PhaserGame';
import { DEBUG_CONFIG } from './game/main';
import { EventBus } from './game/EventBus';

function App() {
    const phaserRef = useRef<IRefPhaserGame | null>(null);

    const toggleDebug = () => {
        DEBUG_CONFIG.showDebugBoxes = !DEBUG_CONFIG.showDebugBoxes;
        EventBus.emit('toggle-debug', DEBUG_CONFIG.showDebugBoxes);
    }

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} />
            <div>
                <div>
                    <button className="button" onClick={toggleDebug}>
                        Debug {DEBUG_CONFIG.showDebugBoxes ? 'An' : 'Aus'}
                    </button>
                </div>
            </div>
        </div>
    )
}

export default App
