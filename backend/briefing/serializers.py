from rest_framework import serializers


class BriefingRequestSerializer(serializers.Serializer):
  watchlist = serializers.ListField(
    child=serializers.CharField(), allow_empty=True, default=list
  )
  date = serializers.CharField(required=False, allow_blank=True)


class StorySerializer(serializers.Serializer):
  title = serializers.CharField()
  summary = serializers.CharField()
  impact = serializers.ChoiceField(choices=["positive", "negative", "neutral"])
  source = serializers.CharField(allow_blank=True)


class MarketSectionSerializer(serializers.Serializer):
  headline = serializers.CharField()
  stories = StorySerializer(many=True)
  market_mood = serializers.ChoiceField(choices=["bullish", "bearish", "mixed"])
  mood_explanation = serializers.CharField()


class WatchlistItemSerializer(serializers.Serializer):
  company = serializers.CharField()
  news = serializers.CharField()
  sentiment = serializers.ChoiceField(choices=["positive", "negative", "neutral"])
  tip = serializers.CharField()


class SummarySectionSerializer(serializers.Serializer):
  tldr = serializers.CharField()
  key_takeaways = serializers.ListField(child=serializers.CharField())
  beginner_tip = serializers.CharField()


class IndexPointSerializer(serializers.Serializer):
  date = serializers.CharField()
  close = serializers.FloatField()


class BriefingResponseSerializer(serializers.Serializer):
  global_ = MarketSectionSerializer(source="global")
  ngx = MarketSectionSerializer()
  watchlist = WatchlistItemSerializer(many=True)
  summary = SummarySectionSerializer()
  date = serializers.CharField()
  global_index = IndexPointSerializer(many=True, required=False)
  ngx_index = IndexPointSerializer(many=True, required=False)

