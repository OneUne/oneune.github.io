module Jekyll
  class ImgTag < Liquid::Tag
    def initialize(tag_name, text, tokens)
      super
      @text = text.strip
    end

    def render(context)
      # @img/ 형식의 경로를 /assets/img/blog/ 경로로 변환
      @text.gsub(/@img\//, context.registers[:site].config['img_path'] + '/')
    end
  end
end

Liquid::Template.register_tag('img_path', Jekyll::ImgTag)

module Jekyll
  module ImgPathFilter
    def img_path(input)
      # @img/ 형식의 경로를 /assets/img/blog/ 경로로 변환
      input.to_s.gsub(/@img\//, Jekyll.configuration({})['img_path'] + '/')
    end
  end
end

Liquid::Template.register_filter(Jekyll::ImgPathFilter)
