Ext.define('Optima5.Modules.Spec.DbsPeople.CfgParamField',{
	extend:'Ext.form.field.Picker',

	requires: ['Ext.XTemplate'], 

	childEls: ['divicon','divtext'],
	fieldSubTpl: [
		'<div id="{id}" type="{type}" ',
			'<tpl if="size">size="{size}" </tpl>',
			'<tpl if="tabIdx">tabIndex="{tabIdx}" </tpl>',
			'class="{fieldCls} {typeCls}" autocomplete="off">',
			'<span id="{cmpId}-divicon" data-ref="divicon" class="biblepicker-icon">&#160;</span>',
			'<span id="{cmpId}-divtext" data-ref="divtext" class="biblepicker-text">&#160;</span>',
		'</div>',
		'<div id="{cmpId}-triggerWrap" class="{triggerWrapCls}" role="presentation">',
			'{triggerEl}',
			'<div class="{clearCls}" role="presentation"></div>',
		'</div>',
		{
			compiled: true,
			disableFormats: true
		}
	],
			  
	

	isFormField: true,
	submitValue: true,
	//resizable: true,
	myValue : null ,
	
	initComponent: function() {
		var me = this ;
		if( (me.optimaModule) instanceof Optima5.Module ) {} else {
			Optima5.Helper.logError('CrmBase:BibleTreePicker','No module reference ?') ;
		}
		
		this.addEvents('ready') ;
		
		this.on('afterrender',this.displayValue,this) ;
		
		this.cfgParamTree = Ext.create('Optima5.Modules.Spec.DbsPeople.CfgParamTree',{
			renderTo: Ext.getBody(),
			floating: true,
			hidden: true,
			focusOnShow: true,
			ownerCt: me.ownerCt,
			pickerField: me,
			
			optimaModule: this.optimaModule,
			cfgParam_id: this.cfgParam_id,
			width:250,
			height:300,
			listeners: {
				change: {
					fn: function(){
						this.onChange() ;
					},
					scope: this
				},
				load: {
					fn: this.onAfterLoad,
					scope: this
				}
			}
		});
		
		this.callParent() ;
	},
	onAfterLoad: function() {
		if( !Optima5.Modules.Spec.DbsPeople.HelperCache.authHelperHasAll() && !this.noAuthCheck ) {
			this.doAuthCleanup() ;
		}
		this.isReady = true ;
		this.fireEvent('ready',this) ;
	},
	doAuthCleanup: function() {},
	
	expand: function() {
		var me = this ;
		if( !me.isReady ) {
			me.on('ready',function(){
				me.expand();
			},me,{
				single:true
			}) ;
			return ;
		}
		this.callParent() ;
	},
	collapse: function() {
		var me = this ;
		this.callParent() ;
	},
	onItemClick: function( picker, record ) {
		var me = this ;
		var oldValue = me.myValue ;
		me.myValue = record.get('entry_key') ;
		this.fireEvent('change',me,me.myValue,oldValue) ;
		me.applyPrettyValue(record) ;
		me.collapse() ;
	},
			  
	createPicker: function() {
		//console.log('created!!') ;
		var me = this ;
		if( !me.isReady ) {
			return null ;
		}
		return this.cfgParamTree ;
	},
	onChange: function() {
		var cfgParamTree = this.cfgParamTree,
			selectedValue = cfgParamTree.getValue() ;
			
		this.value = selectedValue ;
		this.fireEvent('change',this,selectedValue,this.oldValue) ;
		this.oldValue = selectedValue ;
		
		this.displayValue() ;
	},
	displayValue: function() {
		if( !this.rendered ) {
			this.on('afterrender',function(){
				this.displayValue();
			},this,{
				single:true
			}) ;
			return ;
		}
		
		var cfgParamTree = this.cfgParamTree,
			selectedValue = cfgParamTree.getValue() ;
		if( Ext.isEmpty(selectedValue) ) {
			this.divicon.removeCls('biblepicker-iconimg-oktree') ;
			this.divicon.addCls('biblepicker-iconimg-nok') ;
			this.divtext.dom.innerHTML = this.cfgParam_emptyDisplayText ;
		} else {
			this.divicon.removeCls('biblepicker-iconimg-nok') ;
			this.divicon.addCls('biblepicker-iconimg-oktree') ;
			this.divtext.dom.innerHTML = cfgParamTree.getStore().getNodeById(selectedValue).get('nodeText') ;
		}
	},
	
	setRawValue: function(value) {
		this.value = value ;
		
		if( !this.isReady ) {
			this.on('ready',function(){
				this.setRawValue(value);
			},this,{
				single:true
			}) ;
			return ;
		}
		var cfgParamTree = this.cfgParamTree ;
		cfgParamTree.setValue(value,true) ;
		if( Ext.isEmpty(value) ) {
			cfgParamTree.autoAdvance() ;
		}
	},
	
	getRawValue: function() {
		return this.value || '' ;
	},
	getNode: function() {
		var cfgParamTree = this.cfgParamTree,
			retValue = cfgParamTree.getNode() ;
		return retValue ;
	},
	getLeafNodesKey: function() {
		var cfgParamTree = this.cfgParamTree,
			retValue = cfgParamTree.getLeafNodesKey() ;
		return retValue ;
	},
	getErrors: function( curvalue ) {
		var errors = this.callParent(arguments) ;
		return errors;
	}  
});