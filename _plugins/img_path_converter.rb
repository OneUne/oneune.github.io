module Jekyll
  class ImgPathConverter
    def initialize(config)
      @img_path = config['img_path'] || '/assets/img/blog'
    end

    def convert(content)
      # @img/ 형식의 경로를 /assets/img/blog/ 경로로 변환
      content.gsub(/!\[(.*?)\]\(@img\/(.*?)\)/, "![\\1](#{@img_path}/\\2)")
    end
  end

  # Jekyll 마크다운 프로세서 확장
  class ImgPathProcessor
    def initialize(config)
      @converter = ImgPathConverter.new(config)
    end

    def process(content)
      @converter.convert(content)
    end
  end

  # Jekyll 훅에 마크다운 프로세서 등록
  Jekyll::Hooks.register [:posts, :pages], :pre_render do |post|
    if post.extname == '.md'
      processor = ImgPathProcessor.new(post.site.config)
      post.content = processor.process(post.content)
    end
  end
end
