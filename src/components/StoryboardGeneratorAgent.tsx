import { useState, useRef, useEffect } from 'react';
import {
  buildStoryboardRequest,
  callStoryboardGeneration,
  validateStoryboardRequest,
  copyToClipboard,
} from '../services/agentsApi';
import { downloadFile } from '../utils/imageUtils';
import { CacheManager } from '../utils/cacheManager';
import type { AgentStreamingStatus, StoryboardGenerationResult, CharacterInfo } from '../types/agents';
import './StoryboardGeneratorAgent.css';

const DEFAULT_APP_ID = 'e9d6430f0ea04de08dcdc8d39c48a471';
const DEFAULT_PLAY_SHOT_SCRIPTS = JSON.stringify({
  "shot1": "魏无羡在莫家庄破屋醒来，身体不适，看见满地狼藉，发现献舍阵法与莫玄羽字迹，思考自己为何重生。",
  "shot2": "莫子渊带着家仆闯入，踢开屋门，怒骂魏无羡装死，踹了他一脚，让他几欲吐血。",
  "shot3": "莫子渊翻箱倒柜，砸碎家具，搜走魏无羡的符纸、丹药与法器，称'拿你几样东西怎么了，本来就该都是我的！'",
  "shot4": "莫子渊离开后，魏无羡坐起，发现身上有血画环阵，想起自己被献舍，意识到莫玄羽的复仇愿望未完成。",
  "shot5": "魏无羡翻阅莫玄羽的纸团，读到他因断袖骚扰同门被赶回莫家庄的记载，发现莫二娘子为他咽气而死。",
  "shot6": "魏无羡翻出莫玄羽画的'好兄弟'画像，发现这是他想复仇的对象，不是薛洋。",
  "shot7": "魏无羡打坐适应身体，感受莫玄羽灵力低微，心道'这人修仙没指望，更别说夺舍了。'",
  "shot8": "花驴子闯入，惊扰魏无羡，魏无羡踢它，驴子大叫，魏无羡苦笑，自言自语'这是什么破狗，连驴都欺负我。'",
  "shot9": "魏无羡透过窗子，看见蓝家小辈在讨论走尸，心道'走尸？看来是莫子渊偷了蓝家的召阴旗。'",
  "shot10": "蓝忘机和蓝家小辈来到莫家庄，蓝思追和蓝景仪在调查，蓝忘机神情肃穆。",
  "shot11": "蓝忘机查看莫子渊尸体，发现他被邪祟袭击，左手失踪，身上有召阴旗。",
  "shot12": "魏无羡发现莫子渊身上有召阴旗，心下雪亮'莫子渊被我制的召阴旗害了，他偷了旗子去西院，被邪祟盯上。'",
  "shot13": "魏无羡与蓝忘机合奏《安息》，压制邪祟，两人配合默契，蓝忘机弹琴，魏无羡吹笛。",
  "shot14": "莫夫人和莫子渊被邪祟袭击，蓝忘机发现莫夫人被邪祟附身，左手变成男人的手。",
  "shot15": "蓝思追将符篆拍在莫夫人身上，莫夫人的左手化为男人的手，蓝忘机喝道'按住她！'",
  "shot16": "蓝家小辈用校服包裹莫夫人的左手，校服燃烧，绿焰冲天，莫夫人惨叫，手脱落，露出骨头。",
  "shot17": "魏无羡与蓝忘机在莫家庄合奏《安息》，压制邪祟，莫夫人丈夫被邪祟袭击，左手也失踪。",
  "shot18": "蓝思追将符篆拍在莫夫人丈夫身上，他倒地，左手也消失，魏无羡道'不是莫子渊的爹，也不是阿童，他们都是左撇子。'",
  "shot19": "蓝忘机发现莫夫人左手与右手不对称，不是女人的手，是男人的手，蓝思追道'莫夫人左手，比右手长些，也粗些，指节勾起，充满力度。'",
  "shot20": "蓝忘机与魏无羡发现莫夫人左手是被分尸的左手，邪祟附体，蓝忘机喝道'按住她！'",
  "shot21": "蓝家小辈用校服包裹莫夫人的左手，校服燃烧，莫夫人惨叫，左手化为男人的手，甩动手指。",
  "shot22": "蓝忘机与魏无羡在莫家庄合奏《安息》，压制邪祟，莫夫人被邪祟附体，右手握拳，左手甩动。",
  "shot23": "魏无羡发现莫夫人左手是被分尸，心道'好兄弟的尸体被分，藏在各地，这是故意为之。'",
  "shot24": "魏无羡被蓝忘机带回云深不知处，蓝忘机冷淡道'静室。'，魏无羡道'静室？那是含光君的书房。'",
  "shot25": "魏无羡在静室中发现蓝忘机藏酒，心道'含光君还藏酒，这人真有意思，这么正经还藏酒。'",
  "shot26": "魏无羡偷喝蓝忘机的天子笑，蓝忘机发现，道'何事。'，魏无羡道'偷喝天子笑，怎么？含光君，你藏酒不许别人喝？'",
  "shot27": "魏无羡在静室发现蓝忘机的戒鞭伤，心道'蓝湛背上全是戒鞭伤，怎么回事？'",
  "shot28": "魏无羡在静室发现蓝忘机锁在角落的香炉，香气与蓝忘机身上的气味相似。",
  "shot29": "魏无羡在静室发现蓝忘机身上的烙印，和自己生前的一模一样，心道'这烙印，我认识。'。",
  "shot30": "魏无羡发现蓝忘机的锁骨下有烙印，和自己生前的一模一样，心道'蓝湛这人，到底经历了什么？'"
}, null, 2);

export function StoryboardGeneratorAgent() {
  const [appId, setAppId] = useState('');
  const [playShotScripts, setPlayShotScripts] = useState('');
  const [progressMessage, setProgressMessage] = useState('');
  const [characters, setCharacters] = useState<CharacterInfo[]>([]);
  const [result, setResult] = useState<StoryboardGenerationResult | null>(null);
  const [status, setStatus] = useState<AgentStreamingStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [copySuccess, setCopySuccess] = useState<'scripts' | 'images' | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (contentRef.current && status === 'streaming') {
      contentRef.current.scrollTop = contentRef.current.scrollHeight;
    }
  }, [progressMessage, status]);

  // Timer for elapsed time during generation
  useEffect(() => {
    if (status === 'connecting' || status === 'streaming') {
      setElapsedTime(0);
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  const formatElapsedTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGenerate = async () => {
    const validation = validateStoryboardRequest(appId, '生成分镜图', playShotScripts);
    
    if (!validation.valid) {
      setError(validation.error || 'Validation failed');
      return;
    }

    setError(null);
    setProgressMessage('');
    setCharacters([]);
    setResult(null);
    setStatus('connecting');

    const request = buildStoryboardRequest(appId, '生成分镜图', playShotScripts);

    await callStoryboardGeneration(
      request,
      (message: string) => {
        setStatus('streaming');
        setProgressMessage(message);
      },
      (partialCharacters: CharacterInfo[]) => {
        // Show characters immediately when received
        setCharacters(partialCharacters);
        // Save character images to cache
        partialCharacters.forEach((char, idx) => {
          CacheManager.add({
            url: char.image,
            type: 'image',
            source: 'agents',
            sourceName: 'Storyboard - Character',
            timestamp: Date.now() + idx,
            prompt: `${char.name}: ${char.personality}`,
            metadata: {
              characterName: char.name,
              personality: char.personality,
              features: char.features,
            },
          });
        });
      },
      (generatedResult: StoryboardGenerationResult) => {
        setResult(generatedResult);
        // Save storyboard shot images to cache
        if (generatedResult.shotImages && generatedResult.shotImages.length > 0) {
          generatedResult.shotImages.forEach((imageUrl, idx) => {
            const script = generatedResult.refinedScripts[idx];
            CacheManager.add({
              url: imageUrl,
              type: 'image',
              source: 'agents',
              sourceName: 'Storyboard - Shot',
              timestamp: Date.now() + idx,
              prompt: script?.画面内容 || `Shot ${idx + 1}`,
              metadata: {
                shotNumber: idx + 1,
                script: script,
              },
            });
          });
        }
      },
      (err: Error) => {
        setStatus('error');
        setError(err.message);
      },
      () => {
        setStatus('completed');
      }
    );
  };

  const handleCopyRefinedScripts = async () => {
    if (!result || !result.refinedScripts || result.refinedScripts.length === 0) return;
    try {
      const scriptsJson = JSON.stringify(result.refinedScripts, null, 2);
      await copyToClipboard(scriptsJson);
      setCopySuccess('scripts');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      setError('Failed to copy refined scripts');
    }
  };

  const handleCopyStoryboardImages = async () => {
    if (!result || !result.shotImages || result.shotImages.length === 0) return;
    try {
      const imagesJson = JSON.stringify(result.shotImages, null, 2);
      await copyToClipboard(imagesJson);
      setCopySuccess('images');
      setTimeout(() => setCopySuccess(null), 2000);
    } catch (err) {
      setError('Failed to copy storyboard images');
    }
  };

  const handleDownloadImage = async (imageUrl: string, filename: string) => {
    try {
      await downloadFile(imageUrl, filename);
    } catch (err) {
      setError('Failed to download image');
    }
  };

  const handleDownloadAllCharacters = async () => {
    if (!characters || characters.length === 0) return;
    for (let i = 0; i < characters.length; i++) {
      try {
        await handleDownloadImage(characters[i].image, `character-${characters[i].name}-${i + 1}.png`);
        if (i < characters.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (err) {
        console.error(`Failed to download character ${i + 1}:`, err);
      }
    }
  };

  const handleDownloadAllShots = async () => {
    if (!result || !result.shotImages || result.shotImages.length === 0) return;
    for (let i = 0; i < result.shotImages.length; i++) {
      try {
        await handleDownloadImage(result.shotImages[i], `shot-${i + 1}.png`);
        if (i < result.shotImages.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      } catch (err) {
        console.error(`Failed to download shot ${i + 1}:`, err);
      }
    }
  };

  const handleReset = () => {
    setProgressMessage('');
    setCharacters([]);
    setResult(null);
    setStatus('idle');
    setError(null);
    setCopySuccess(null);
  };

  const isGenerating = status === 'connecting' || status === 'streaming';
  const hasCharacters = characters.length > 0;
  const hasShots = result !== null && result.refinedScripts.length > 0 && result.shotImages.length > 0;

  return (
    <div className="storyboard-agent">
      <div className="agent-header">
        <h2>📋 AI Storyboard Generator</h2>
        <p>Generate creative storyboard images from scripts for video production using AI workflow</p>
      </div>

      {status === 'idle' && (
        <div className="input-section">
          <div className="input-group">
            <label htmlFor="appId">Application ID *</label>
            <input
              id="appId"
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              onFocus={(e) => {
                if (!e.target.value) {
                  setAppId(DEFAULT_APP_ID);
                }
              }}
              placeholder={DEFAULT_APP_ID}
              className="input-field"
            />
            <p className="input-hint">
              APP ID from Bailian Platform workflow application
            </p>
          </div>

          <div className="input-group">
            <label htmlFor="scripts">Play Shot Scripts (JSON format, max 30 shots) *</label>
            <textarea
              id="scripts"
              value={playShotScripts}
              onChange={(e) => setPlayShotScripts(e.target.value)}
              onFocus={(e) => {
                if (!e.target.value) {
                  setPlayShotScripts(DEFAULT_PLAY_SHOT_SCRIPTS);
                }
              }}
              placeholder={DEFAULT_PLAY_SHOT_SCRIPTS}
              maxLength={10000}
              rows={10}
              className="input-field"
            />
            <p className="input-hint">
              {playShotScripts.length}/10000 characters - JSON format with shot1, shot2, etc.
            </p>
          </div>

          <button
            onClick={handleGenerate}
            disabled={!appId || !playShotScripts}
            className="generate-btn"
          >
            🚀 Generate Storyboard
          </button>
        </div>
      )}

      {isGenerating && (
        <div className="streaming-section">
          <div className="streaming-header">
            <div className="streaming-indicator">
              <div className="loading-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="streaming-text">
                {status === 'connecting' ? 'Connecting to workflow...' : progressMessage || 'Processing...'}
              </span>
            </div>
            <div className="elapsed-time">
              ⏱️ {formatElapsedTime(elapsedTime)}
            </div>
          </div>

          <div className="streaming-content" ref={contentRef}>
            {progressMessage || 'Waiting for response...'}
            {elapsedTime > 30 && (
              <p className="patience-message">
                ⏳ AI workflow is processing... This may take 2-5 minutes for complex scenes.
              </p>
            )}
          </div>
        </div>
      )}

      {(hasCharacters || hasShots) && (
        <div className="result-section">
          <div className="result-header">
            <h3>✨ Generation Results</h3>
            <div className="result-actions">
              {hasShots && (
                <>
                  <button 
                    onClick={handleCopyRefinedScripts} 
                    className="action-btn"
                    disabled={!result?.refinedScripts || result.refinedScripts.length === 0}
                  >
                    {copySuccess === 'scripts' ? '✓ Copied!' : '📋 Copy Refined Scripts'}
                  </button>
                  <button 
                    onClick={handleCopyStoryboardImages} 
                    className="action-btn"
                    disabled={!result?.shotImages || result.shotImages.length === 0}
                  >
                    {copySuccess === 'images' ? '✓ Copied!' : '📋 Copy Storyboard Shots'}
                  </button>
                </>
              )}
              <button onClick={handleReset} className="action-btn reset">
                🔄 New Generation
              </button>
            </div>
          </div>

          {/* Character Library Section */}
          {hasCharacters && (
            <div className="characters-section">
              <div className="section-title-row">
                <h4>👥 Character Library ({characters.length})</h4>
                <button onClick={handleDownloadAllCharacters} className="download-all-btn">
                  ⬇️ Download All Character Images
                </button>
              </div>
              <div className="character-grid">
                {characters.map((char, idx) => (
                  <div key={idx} className="character-card">
                    <div className="character-image-wrapper">
                      <img src={char.image} alt={char.name} className="character-image" />
                      <button 
                        className="image-download-overlay"
                        onClick={() => handleDownloadImage(char.image, `character-${char.name}-${idx + 1}.png`)}
                        title="Download image"
                      >
                        ⬇️ Download
                      </button>
                    </div>
                    <div className="character-info">
                      <h5>{char.name}</h5>
                      <p><strong>Personality:</strong> {char.personality}</p>
                      <p><strong>Features:</strong> {char.features}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Storyboard Shots Section */}
          {!hasShots && hasCharacters && isGenerating && (
            <div className="shots-generating">
              <div className="loading-indicator">
                <div className="loading-dots">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
                <p>Generating storyboard shots...</p>
              </div>
            </div>
          )}

          {hasShots && result && (
            <div className="shots-section">
              <div className="section-title-row">
                <h4>🎬 Storyboard Shots ({result.refinedScripts.length})</h4>
                <button onClick={handleDownloadAllShots} className="download-all-btn">
                  ⬇️ Download All Shot Images
                </button>
              </div>
              <div className="shots-list">
                {result.refinedScripts.map((script, idx) => (
                  <div key={idx} className="shot-item">
                    <div className="shot-header">
                      <span className="shot-number">Shot {idx + 1}</span>
                    </div>
                    <div className="shot-content">
                      <div className="shot-script">
                        <div className="script-field">
                          <strong>景别:</strong> {script.景别}
                        </div>
                        <div className="script-field">
                          <strong>画面内容:</strong> {script.画面内容}
                        </div>
                        <div className="script-field">
                          <strong>音效台词:</strong> {script.音效台词}
                        </div>
                        <div className="script-field">
                          <strong>场景地:</strong> {script.场景地}
                        </div>
                      </div>
                      {result.shotImages[idx] && (
                        <div className="shot-image-wrapper">
                          <img src={result.shotImages[idx]} alt={`Shot ${idx + 1}`} className="shot-image" />
                          <button 
                            className="image-download-overlay"
                            onClick={() => handleDownloadImage(result.shotImages[idx], `shot-${idx + 1}.png`)}
                            title="Download image"
                          >
                            ⬇️ Download
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {error && (
        <div className="error-message">
          <p>⚠️ {error}</p>
          <button onClick={() => setError(null)} className="dismiss-btn">
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
