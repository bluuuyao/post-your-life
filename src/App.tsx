/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  ArrowRight, 
  Camera, 
  CheckCircle2, 
  TrendingUp, 
  Layout, 
  Share2, 
  RefreshCw,
  ChevronRight,
  User,
  Heart,
  Zap
} from 'lucide-react';
import { QuizQuestion, QuizAnswers, NicheResult, GeneratedPost } from './types';
import { analyzeNiche, generateFirstPost } from './services/gemini';
import Markdown from 'react-markdown';

const QUESTIONS: QuizQuestion[] = [
  {
    id: 'weekend_activity',
    question: '如果周末给你一整天完全空白的独处时间，且不能出门，你会如何度过？',
    options: [
      '把房间打扫布置得井井有条，看着很治愈。',
      '钻研平时没空搞的爱好，比如做顿大餐、拼乐高、画画。',
      '疯狂刷剧、看八卦、看书，脑子里疯狂输出各种观后感。',
      '疯狂网购、做功课、比价，购物车加得满满当当。'
    ],
    multiSelect: false
  },
  {
    id: 'sunset_reaction',
    question: '下班/放学路上，你偶遇了一场绝美的晚霞，你的第一反应是？',
    options: [
      '赶紧找好角度，拍出一张构图完美的照片。',
      '拍一段Live图或视频，记录下这一刻的环境音和氛围。',
      '脑海里瞬间涌现出一句感性的话，甚至想发个带文字的朋友圈。',
      '立刻发到闺蜜群/兄弟群：“快看天！太美了卧槽！”'
    ],
    multiSelect: false
  },
  {
    id: 'friend_role',
    question: '在朋友眼中，你通常充当什么角色？',
    options: [
      '「活体大众点评」：去哪吃、去哪玩问我就对了。',
      '「人间清醒导师」：朋友遇到感情/职场烦恼都爱找我倾诉。',
      '「审美天花板」：朋友买衣服、搞发型总爱让我帮忙参考。',
      '「搞笑显眼包」：有我在绝对不会冷场，每天发生各种离谱小事。'
    ],
    multiSelect: false
  },
  {
    id: 'rant_topic',
    question: '如果现在让你立刻吐槽一件事，你会选？',
    options: [
      '职场/学校里的奇葩人或奇葩规定。',
      '买到了超级难用/超级难看的东西，必须避雷！',
      '自己的某个身材/容貌小焦虑，或者努力改变的过程。',
      '生活里某个非常微小但让人崩溃的瞬间。'
    ],
    multiSelect: false
  },
  {
    id: 'photo_album',
    question: '现在打开你手机的相册，里面占据内存最多的是什么照片？',
    options: [
      '自己各种角度的自拍 / 对镜拍。',
      '各种美食探店 / 好看的风景 / 探店打卡。',
      '各种沙雕表情包 / 网购截图 / 备忘录截图。',
      '宠物 / 家人 / 乱七八糟但真实的生活瞬间。'
    ],
    multiSelect: false
  }
];

export default function App() {
  const [step, setStep] = useState<'landing' | 'quiz' | 'analyzing' | 'result' | 'creating' | 'final'>('landing');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>({});
  const [tempMultiAnswers, setTempMultiAnswers] = useState<string[]>([]);
  const [result, setResult] = useState<NicheResult | null>(null);
  const [generatedPost, setGeneratedPost] = useState<GeneratedPost | null>(null);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isGeneratingPost, setIsGeneratingPost] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleStart = () => {
    setStep('quiz');
    setError(null);
    setCurrentQuestionIndex(0);
    setAnswers({});
    setTempMultiAnswers([]);
  };

  const handleSingleAnswer = (answer: string) => {
    const questionId = QUESTIONS[currentQuestionIndex].id;
    const newAnswers = { ...answers, [questionId]: answer };
    setAnswers(newAnswers);
    proceedToNext(newAnswers);
  };

  const toggleMultiAnswer = (option: string) => {
    setTempMultiAnswers(prev => 
      prev.includes(option) ? prev.filter(a => a !== option) : [...prev, option]
    );
  };

  const handleMultiSubmit = () => {
    if (tempMultiAnswers.length === 0) return;
    const questionId = QUESTIONS[currentQuestionIndex].id;
    const newAnswers = { ...answers, [questionId]: tempMultiAnswers };
    setAnswers(newAnswers);
    setTempMultiAnswers([]);
    proceedToNext(newAnswers);
  };

  const proceedToNext = (currentAnswers: QuizAnswers) => {
    if (currentQuestionIndex < QUESTIONS.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleAnalyze(currentAnswers);
    }
  };

  const handleAnalyze = async (finalAnswers: QuizAnswers) => {
    setStep('analyzing');
    setError(null);
    try {
      const niche = await analyzeNiche(finalAnswers);
      setResult(niche);
      setStep('result');
    } catch (err) {
      console.error("Analysis failed:", err);
      setError("分析定位时出错了，请稍后再试。");
      setStep('landing');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages = Array.from(files).map(file => URL.createObjectURL(file));
      setUploadedImages(prev => [...prev, ...newImages].slice(0, 9));
      setCurrentImageIndex(0);
    }
  };

  const handleGeneratePost = async () => {
    if (!result) return;
    setIsGeneratingPost(true);
    setError(null);
    try {
      const post = await generateFirstPost(result, "User has uploaded some lifestyle images.");
      setGeneratedPost(post);
      setStep('final');
    } catch (err) {
      console.error("Post generation failed:", err);
      setError("生成博文时出错了，请稍后再试。");
    } finally {
      setIsGeneratingPost(false);
    }
  };

  const nextImage = () => {
    if (uploadedImages.length > 0) {
      setCurrentImageIndex(prev => (prev + 1) % uploadedImages.length);
    }
  };

  const prevImage = () => {
    if (uploadedImages.length > 0) {
      setCurrentImageIndex(prev => (prev - 1 + uploadedImages.length) % uploadedImages.length);
    }
  };

  return (
    <div className="min-h-screen font-sans selection:bg-zinc-900 selection:text-white">
      <nav className="fixed top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-white/50 backdrop-blur-sm">
        <div className="flex items-center gap-2 font-display font-bold text-xl tracking-tighter cursor-pointer" onClick={() => setStep('landing')}>
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center text-white">
            <Zap size={18} />
          </div>
          <span>NICHE FINDER</span>
        </div>
      </nav>

      <main className="pt-24 pb-12 px-6 max-w-4xl mx-auto">
        <AnimatePresence mode="wait">
          {step === 'landing' && (
            <motion.div
              key="landing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-center space-y-12 py-20"
            >
              <div className="space-y-6">
                <motion.h1 
                  className="text-5xl md:text-8xl font-display font-bold tracking-tighter leading-[0.9]"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  每个人都有<br />
                  <span className="text-zinc-400 italic">成为博主</span>的潜力
                </motion.h1>
                <p className="text-lg md:text-xl text-zinc-500 max-w-xl mx-auto px-4">
                  不知道该分享什么？不知道从哪开始？<br />
                  只需3分钟，AI 帮你挖掘你的自媒体基因，生成你的第一篇爆款。
                </p>
                {error && (
                  <div className="space-y-4">
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 max-w-md mx-auto">
                      {error}
                    </div>
                    <button 
                      onClick={handleStart}
                      className="text-zinc-400 hover:text-zinc-900 text-sm font-medium underline underline-offset-4"
                    >
                      重试测试
                    </button>
                  </div>
                )}
              </div>

              <button 
                onClick={handleStart}
                className="brutal-btn text-xl group"
              >
                开始测试
                <ArrowRight className="inline-block ml-2 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-12 opacity-50 grayscale">
                <div className="p-4 border border-zinc-200 rounded-2xl text-sm flex items-center md:block gap-3">
                  <TrendingUp className="md:mx-auto md:mb-2 shrink-0" size={20} />
                  <span>实时趋势分析</span>
                </div>
                <div className="p-4 border border-zinc-200 rounded-2xl text-sm flex items-center md:block gap-3">
                  <Sparkles className="md:mx-auto md:mb-2 shrink-0" size={20} />
                  <span>AI 定位建议</span>
                </div>
                <div className="p-4 border border-zinc-200 rounded-2xl text-sm flex items-center md:block gap-3">
                  <Layout className="md:mx-auto md:mb-2 shrink-0" size={20} />
                  <span>一键生成图文</span>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'quiz' && (
            <motion.div
              key="quiz"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8 py-12"
            >
              <div className="flex justify-between items-end">
                <div className="space-y-2">
                  <span className="text-sm font-bold uppercase tracking-widest text-zinc-400">
                    Question {currentQuestionIndex + 1} / {QUESTIONS.length}
                  </span>
                  <h2 className="text-4xl font-display font-bold">
                    {QUESTIONS[currentQuestionIndex].question}
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {QUESTIONS[currentQuestionIndex].options.map((option, idx) => {
                  const isSelected = QUESTIONS[currentQuestionIndex].multiSelect 
                    ? tempMultiAnswers.includes(option)
                    : false;
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => QUESTIONS[currentQuestionIndex].multiSelect ? toggleMultiAnswer(option) : handleSingleAnswer(option)}
                      className={`p-6 text-left brutal-border transition-all text-lg font-medium flex justify-between items-center group ${
                        isSelected ? 'bg-zinc-900 text-white translate-x-1 translate-y-1 shadow-none' : 'bg-white hover:bg-zinc-50'
                      }`}
                    >
                      {option}
                      {QUESTIONS[currentQuestionIndex].multiSelect ? (
                        <div className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-colors ${isSelected ? 'border-white bg-white/20' : 'border-zinc-200'}`}>
                          {isSelected && <CheckCircle2 size={16} />}
                        </div>
                      ) : (
                        <ChevronRight className="opacity-0 group-hover:opacity-100 transition-opacity" />
                      )}
                    </button>
                  );
                })}
              </div>

              <div className="flex justify-between items-center pt-8">
                <div className="w-2/3 bg-zinc-100 h-1 rounded-full overflow-hidden">
                  <motion.div 
                    className="bg-zinc-900 h-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentQuestionIndex + 1) / QUESTIONS.length) * 100}%` }}
                  />
                </div>
                {QUESTIONS[currentQuestionIndex].multiSelect && (
                  <button 
                    onClick={handleMultiSubmit}
                    disabled={tempMultiAnswers.length === 0}
                    className="brutal-btn py-2 disabled:opacity-50"
                  >
                    下一题
                  </button>
                )}
              </div>
            </motion.div>
          )}

          {step === 'analyzing' && (
            <motion.div
              key="analyzing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-32 space-y-8"
            >
              <div className="relative">
                <motion.div 
                  className="w-24 h-24 border-4 border-zinc-900 border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-zinc-900" size={32} />
              </div>
              <div className="text-center space-y-4">
                <div className="space-y-2">
                  <h3 className="text-2xl font-display font-bold">正在为你量身定制...</h3>
                  <p className="text-zinc-500">AI 正在扫描全网热门趋势并匹配你的特质</p>
                </div>
                <button 
                  onClick={() => setStep('landing')}
                  className="text-zinc-400 hover:text-zinc-900 text-sm font-medium underline underline-offset-4 pt-4"
                >
                  取消并返回
                </button>
              </div>
            </motion.div>
          )}

          {step === 'result' && result && (
            <motion.div
              key="result"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-12 py-12"
            >
              <div className="text-center space-y-4">
                <div className="inline-block px-4 py-1 bg-zinc-900 text-white text-xs font-bold rounded-full uppercase tracking-widest">
                  Analysis Complete
                </div>
                <h2 className="text-5xl font-display font-bold">
                  你很有潜力成为<br />
                  <span className="text-zinc-400 underline decoration-zinc-200 underline-offset-8">
                    {result.platform} 的 {result.nicheType} 博主
                  </span>
                </h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="p-8 brutal-border bg-white space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <CheckCircle2 size={20} className="text-emerald-500" />
                    为什么适合你？
                  </h4>
                  <p className="text-zinc-600 leading-relaxed">
                    {result.reasoning}
                  </p>
                </div>

                <div className="p-8 brutal-border bg-zinc-900 text-white space-y-4">
                  <h4 className="font-bold flex items-center gap-2">
                    <TrendingUp size={20} className="text-amber-400" />
                    近期热门趋势
                  </h4>
                  <ul className="space-y-3">
                    {result.trendingTopics.map((topic, i) => (
                      <li key={i} className="text-sm border-b border-zinc-800 pb-2 last:border-0">
                        <div className="font-bold">{topic.title}</div>
                        <div className="text-zinc-400 text-xs">{topic.description}</div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-8 bg-zinc-50 rounded-3xl border border-zinc-200 space-y-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-2xl font-display font-bold">准备好发布第一篇内容了吗？</h3>
                  <Sparkles className="text-zinc-400" />
                </div>
                <p className="text-zinc-500">
                  我们将根据你的定位，结合目前的爆款模版，帮你生成第一篇图文。
                </p>
                
                <div className="flex flex-col items-center gap-6">
                  <div className="w-full">
                    <label className="block w-full brutal-border bg-white p-12 text-center cursor-pointer hover:bg-zinc-50 transition-colors">
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*" 
                        className="hidden" 
                        onChange={handleImageUpload}
                      />
                      <Camera className="mx-auto mb-4 text-zinc-400" size={48} />
                      <span className="font-bold">点击上传你的生活照/素材 (最多9张)</span>
                      <p className="text-xs text-zinc-400 mt-2">AI 会根据照片内容优化文案</p>
                    </label>
                  </div>

                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-3 md:grid-cols-5 gap-4 w-full">
                      {uploadedImages.map((src, i) => (
                        <div key={i} className="aspect-square brutal-border overflow-hidden relative group">
                          <img src={src} alt="upload" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <button 
                            onClick={() => setUploadedImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  <button 
                    onClick={handleGeneratePost}
                    disabled={isGeneratingPost || uploadedImages.length === 0}
                    className="brutal-btn w-full disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isGeneratingPost ? (
                      <>
                        <RefreshCw className="animate-spin" size={20} />
                        正在构思文案...
                      </>
                    ) : (
                      <>
                        生成我的第一篇博文
                        <ChevronRight size={20} />
                      </>
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {step === 'final' && generatedPost && (
            <motion.div
              key="final"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="py-12 space-y-12"
            >
              <div className="text-center space-y-4">
                <h2 className="text-4xl font-display font-bold">你的第一篇爆款已就绪！</h2>
                <p className="text-zinc-500">这是根据 {result?.platform} 流行风格生成的初稿</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="brutal-border bg-white overflow-hidden flex flex-col">
                  <div className="p-4 border-b border-zinc-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-100 flex items-center justify-center">
                      <User size={20} />
                    </div>
                    <div>
                      <div className="font-bold text-sm">你的新账号</div>
                      <div className="text-[10px] text-zinc-400 uppercase tracking-widest">New Creator</div>
                    </div>
                  </div>
                  
                  <div className="aspect-[4/5] bg-zinc-100 relative overflow-hidden group">
                    <AnimatePresence mode="wait">
                      <motion.img 
                        key={currentImageIndex}
                        src={uploadedImages[currentImageIndex]} 
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        className="w-full h-full object-cover" 
                        referrerPolicy="no-referrer" 
                      />
                    </AnimatePresence>
                    
                    {uploadedImages.length > 1 && (
                      <>
                        <button 
                          onClick={prevImage}
                          className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight className="rotate-180" size={16} />
                        </button>
                        <button 
                          onClick={nextImage}
                          className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/30 backdrop-blur-md text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ChevronRight size={16} />
                        </button>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                          {uploadedImages.map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-1.5 h-1.5 rounded-full transition-all ${i === currentImageIndex ? 'bg-white w-3' : 'bg-white/50'}`} 
                            />
                          ))}
                        </div>
                        <div className="absolute top-4 right-4 bg-black/50 backdrop-blur-sm text-white text-[10px] px-2 py-1 rounded">
                          {currentImageIndex + 1}/{uploadedImages.length}
                        </div>
                      </>
                    )}
                  </div>

                  <div className="p-6 space-y-4">
                    <h3 className="text-xl font-bold leading-tight">
                      {generatedPost.title}
                    </h3>
                    <div className="text-sm text-zinc-600 whitespace-pre-wrap leading-relaxed">
                      {generatedPost.content}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {generatedPost.tags.map((tag, i) => (
                        <span key={i} className="text-blue-500 text-sm">#{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="p-4 border-t border-zinc-100 flex justify-between items-center">
                    <div className="flex gap-4 text-zinc-400">
                      <Heart size={20} />
                      <Share2 size={20} />
                    </div>
                    <div className="text-[10px] text-zinc-300 font-bold uppercase">Preview Only</div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <h4 className="text-xl font-display font-bold flex items-center gap-2">
                      <Sparkles size={20} className="text-amber-500" />
                      AI 创作建议
                    </h4>
                    <div className="prose prose-zinc prose-sm">
                      <Markdown>
                        {`### 为什么这个标题会火？
- **痛点抓取**：利用了“反差”或“干货”心理。
- **视觉建议**：第一张图建议使用${generatedPost.layoutType === 'vibrant' ? '高饱和度、明亮' : '干净、极简'}的构图。
- **发布时间**：建议在晚上 8:00 - 10:00 发布，这是${result?.platform}的流量高峰。`}
                      </Markdown>
                    </div>
                  </div>

                  <div className="p-6 bg-zinc-900 text-white rounded-2xl space-y-4">
                    <h4 className="font-bold">下一步行动</h4>
                    <ul className="space-y-3 text-sm text-zinc-400">
                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] mt-0.5">1</div>
                        复制文案到你的备忘录
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] mt-0.5">2</div>
                        使用修图软件添加一些氛围感滤镜
                      </li>
                      <li className="flex items-start gap-2">
                        <div className="w-5 h-5 rounded-full bg-zinc-800 flex items-center justify-center text-[10px] mt-0.5">3</div>
                        发布并坚持更新，AI 预测你将在 3 个月内获得首批 1000 粉丝
                      </li>
                    </ul>
                  </div>

                  <div className="flex gap-4">
                    <button 
                      onClick={() => setStep('landing')}
                      className="flex-1 p-4 border border-zinc-200 rounded-xl font-bold hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"
                    >
                      <RefreshCw size={18} />
                      重新测试
                    </button>
                    <button 
                      className="flex-1 brutal-btn flex items-center justify-center gap-2"
                      onClick={() => window.print()}
                    >
                      <Share2 size={18} />
                      保存结果
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="py-12 px-6 border-t border-zinc-100 text-center text-zinc-400 text-xs">
        <p>© 2024 NicheFinder AI. Powered by Gemini 3.1 Pro.</p>
      </footer>
    </div>
  );
}
