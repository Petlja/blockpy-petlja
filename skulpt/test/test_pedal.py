from pedal.source import set_source

set_source("a = 0")

from pedal.tifa import tifa_analysis

tifa_analysis()

from pedal.resolvers import simple

print(simple.select())