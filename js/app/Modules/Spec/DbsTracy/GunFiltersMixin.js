Ext.define('Optima5.Modules.Spec.DbsTracy.GunFiltersMixin',{
	requires:[
		'Optima5.Modules.Spec.DbsTracy.GunFiltersForm'
	],
	
	_filterValues: null,
	
	constructor : function () {
		var filterValues = Optima5.Modules.Spec.DbsTracy.GunHelper.getFilters() ;
		this._filterValues = filterValues || {} ;
	},
	
	openModalFilters: function() {
		this.getEl().mask() ;
		// Open panel
		var createPanel = Ext.create('Optima5.Modules.Spec.DbsTracy.GunFiltersForm',{
			_filterValues: this._filterValues,
			
			optimaModule: this.optimaModule,
			width:400, // dummy initial size, for border layout to work
			height:null, // ...
			floating: true,
			draggable: true,
			resizable: true,
			renderTo: this.getEl(),
			tools: [{
				type: 'close',
				handler: function(e, t, p) {
					p.ownerCt.destroy();
				},
				scope: this
			}]
		});
		createPanel.on('submit', function(p,filterValues) {
			this._filterValues = filterValues ;
			p.destroy() ;
			this.onFilterChangedLocal() ;
		},this,{single:true}) ;
		createPanel.on('destroy',function(p) {
			this.getEl().unmask() ;
			this.floatingPanel = null ;
		},this,{single:true}) ;
		
		createPanel.show();
		createPanel.getEl().alignTo(this.getEl(), 'c-c?');
		this.floatingPanel = createPanel ;
	},
	getFilterValues: function() {
		var filterValues = {} ;
		Ext.Object.each( this._filterValues, function(k,v) {
			if( v ) {
				filterValues[k] = v ;
			}
		}) ;
		return filterValues ;
	},
	onFilterChangedLocal: function() {
		Optima5.Modules.Spec.DbsTracy.GunHelper.setFilters( this.getFilterValues() ) ;
		this.onFilterChanged() ;
	},
	onFilterChanged: function() {
		// to be overridden
	}
}) ;
