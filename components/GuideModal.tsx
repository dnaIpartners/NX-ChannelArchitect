
import React from 'react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-6">
        <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-3 border-b-2 border-slate-200 dark:border-slate-700 pb-2">{title}</h3>
        <div className="space-y-2 text-slate-600 dark:text-slate-300 leading-relaxed text-sm">{children}</div>
    </div>
);

const GuideModal: React.FC<GuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4 transition-opacity"
      onClick={onClose}
    >
      <div 
        className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-2xl shadow-lg max-w-4xl w-full text-left border-t-4 border-blue-500 relative animate-fade-in-up max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4 pb-4 border-b border-slate-200 dark:border-slate-700 flex-shrink-0">
            <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                <i className="fas fa-book-open text-blue-500 mr-2"></i>
                사용 설명서
            </h2>
            <button 
                onClick={onClose} 
                className="text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-3xl font-light w-10 h-10 flex items-center justify-center rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                aria-label="닫기"
            >
            &times;
            </button>
        </div>

        <div className="overflow-y-auto pr-2 flex-grow">
            <Section title="앱 개요">
                <p><strong>NX ChannelArchitect</strong>는 크리에이터를 위한 강력한 AI 기반 데이터 분석 도구입니다. 이 앱을 통해 채널과 키워드를 심층 분석하여 숨겨진 인사이트를 발견하고, 데이터 기반의 성장 전략을 수립할 수 있습니다.</p>
            </Section>

            <Section title="1. YouTube Data API v3 키 발급 및 설정">
                <p>이 앱의 모든 기능을 사용하려면 Google의 YouTube Data API v3 키가 필요합니다. API는 하루에 일정량의 무료 사용량(쿼터)을 제공하며, 일반적인 분석에는 충분합니다.</p>
                <ol className="list-decimal list-inside space-y-2 mt-2 pl-2">
                    <li><strong>Google Cloud Console 접속:</strong> <a href="https://console.cloud.google.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 dark:text-blue-400 hover:underline font-semibold">Google Cloud Console</a>에 로그인합니다.</li>
                    <li><strong>새 프로젝트 생성:</strong> 상단의 프로젝트 선택 메뉴에서 '새 프로젝트'를 클릭하여 새로운 프로젝트를 만듭니다.</li>
                    <li><strong>API 및 서비스 활성화:</strong>
                        <ul className="list-disc list-inside mt-1 pl-4">
                            <li>왼쪽 메뉴에서 'API 및 서비스' &gt; '라이브러리'로 이동합니다.</li>
                            <li>'YouTube Data API v3'를 검색하여 선택하고 '사용 설정' 버튼을 클릭합니다.</li>
                        </ul>
                    </li>
                    <li><strong>API 키 생성:</strong>
                        <ul className="list-disc list-inside mt-1 pl-4">
                            <li>왼쪽 메뉴에서 'API 및 서비스' &gt; '사용자 인증 정보'로 이동합니다.</li>
                            <li>상단의 '+ 사용자 인증 정보 만들기'를 클릭하고 'API 키'를 선택합니다.</li>
                            <li>생성된 API 키를 복사합니다.</li>
                        </ul>
                    </li>
                    <li><strong>앱에 키 등록:</strong> 앱 우측 상단의 <i className="fas fa-cog"></i> 아이콘을 클릭하여 API 키 설정창을 열고, 복사한 키를 붙여넣은 후 '저장하고 시작하기'를 누릅니다. 키는 브라우저에 암호화되어 안전하게 저장됩니다.</li>
                </ol>
            </Section>

            <Section title="2. 주요 기능 사용법">
                <div className="space-y-4">
                    <div>
                        <h4 className="font-bold text-md text-slate-700 dark:text-slate-200">2.1 채널 분석</h4>
                        <p>특정 유튜브 채널의 모든 영상을 분석하여 성과를 측정하고, AI를 통해 성장 전략을 도출합니다. 채널의 URL, ID(@핸들 포함), 또는 이름을 입력하여 검색할 수 있습니다.</p>
                        <ul className="list-disc list-inside mt-1 pl-4">
                            <li><strong>분석 대시보드:</strong> 채널의 핵심 지표(구독자, 조회수 등)와 인기 영상들의 성과 분포(인기 점수, 조회수, 좋아요, 댓글), 성과 타임라인, 콘텐츠 포맷(일반/쇼츠) 분포를 다양한 차트로 확인합니다.</li>
                            <li><strong>인기 영상 목록:</strong> '인기 점수' 순으로 정렬된 영상 목록을 통해 채널의 핵심 콘텐츠를 파악합니다. 정렬 기준은 조회수, 최신순으로 변경 가능합니다.</li>
                            <li><strong>AI 영상 요약:</strong> 각 영상의 설명란을 AI가 요약하여 빠르게 핵심을 파악할 수 있습니다.</li>
                            <li><strong>AI 기반 심층 분석 기능:</strong>
                                <ul className="list-['–'] list-inside mt-1 pl-4">
                                    <li><strong>AI로 경쟁 전략 분석:</strong> 분석한 채널을 벤치마킹하여, 경쟁에서 이길 수 있는 새로운 채널 컨셉과 구체적인 운영 전략(콘텐츠, 업로드, 커뮤니티, 수익화 등)을 제안받습니다.</li>
                                    <li><strong>AI로 성장 과정 분석:</strong> 채널의 전체 영상을 초기-중기-최신 3단계로 나누어, 각 시기별 성과와 콘텐츠 전략의 변화를 심층 분석하여 성공 요인을 파악합니다.</li>
                                    <li><strong>AI 채널 진단 및 컨설팅:</strong> 채널 소유자의 입장에서 현재 채널의 문제점을 진단하고, 성장을 위한 구체적인 단기/장기 솔루션과 실행 계획(Action Plan)을 제공받습니다.</li>
                                </ul>
                            </li>
                        </ul>
                    </div>
                    <div>
                        <h4 className="font-bold text-md text-slate-700 dark:text-slate-200">2.2 키워드 분석</h4>
                        <p>특정 키워드로 어떤 영상들이 인기를 끌고 있는지 분석하여 시장 트렌드를 파악하고 새로운 채널 기회를 모색합니다. 카테고리를 지정하여 더 정확한 분석이 가능합니다.</p>
                         <ul className="list-disc list-inside mt-1 pl-4">
                            <li><strong>트렌드 대시보드:</strong> 해당 키워드의 상위 영상들의 성과 분포, 채널 점유율, 영상 연령 분포 등을 차트로 확인합니다.</li>
                            <li><strong>필터링 기능:</strong> 국가(한국/해외), 영상 포맷(일반/쇼츠)으로 필터링하여 원하는 조건의 영상만 분석할 수 있습니다.</li>
                             <li><strong>AI로 경쟁 전략 분석:</strong> 분석된 키워드 트렌드를 바탕으로, 해당 주제로 성공할 수 있는 신규 채널의 컨셉과 운영 전략을 제안받습니다.</li>
                        </ul>
                    </div>
                     <div>
                        <h4 className="font-bold text-md text-slate-700 dark:text-slate-200">2.3 공략 채널 찾기</h4>
                        <p>경쟁이 덜하거나 새롭게 떠오르는 기회의 영역을 찾아냅니다. 해시태그를 기반으로 시장을 분석합니다.</p>
                         <ul className="list-disc list-inside mt-1 pl-4">
                            <li><strong>라이징 스타 채널 찾기:</strong> 최근(3개월, 6개월, 1년)에 개설되었지만 영상 대비 구독자 전환율이 높은 '떡상' 채널들을 찾아 벤치마킹 기회를 얻습니다.</li>
                            <li><strong>빈집 토픽 찾기:</strong> 특정 해시태그의 상위 영상들을 분석하여 시장의 경쟁 강도를 측정합니다. AI가 조회수, 채널 집중도, 채널 활성도 데이터를 종합 분석하여 해당 토픽이 소수 채널이 독점하는 '레드오션'인지, 다양한 채널에 기회가 있는 '블루오션'인지 판단하고, 신규 진입자를 위한 차별화 전략을 제시합니다.</li>
                        </ul>
                    </div>
                </div>
            </Section>
        </div>
      </div>
       <style>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.3s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default GuideModal;